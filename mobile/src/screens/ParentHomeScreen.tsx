/** Accueil parent : enfants liés, aperçu du trimestre et raccourcis. */
import React, { useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../auth';
import { useChildren } from '../children';
import { api } from '../api';
import { theme } from '../theme';
import {
  Avatar,
  Card,
  Empty,
  ErrorState,
  Loading,
  SectionHeader,
} from '../ui';
import { fullName, money } from '../format';
import type { ParentMeta, Bulletin, ParentFinancesResponse } from '../types';
import { useApiQuery } from '../useApiQuery';

export default function ParentHomeScreen() {
  const navigation = useNavigation<{ navigate(name: string): void }>();
  const { user } = useAuth();
  const { children, loading, error, reload, select } = useChildren();
  const meta = useApiQuery<ParentMeta>(() => api.get<ParentMeta>('/parent/meta'), []);

  const [averages, setAverages] = useState<Record<number, number | null>>({});
  const [outstanding, setOutstanding] = useState<Record<number, number | null>>({});

  useEffect(() => {
    let cancelled = false;

    async function loadSnapshot() {
      const results = await Promise.allSettled(children.map(async (child) => {
        const [card, finances] = await Promise.allSettled([
          api.get<Bulletin>(`/parent/children/${child.id}/report-card`),
          api.get<ParentFinancesResponse>(`/parent/children/${child.id}/finances`),
        ]);

        return {
          id: child.id,
          average: card.status === 'fulfilled' ? card.value.general_average : null,
          outstanding: finances.status === 'fulfilled' ? finances.value.summary.outstanding : null,
        };
      }));
      if (cancelled) return;
      setAverages(Object.fromEntries(results.flatMap((r) => (r.status === 'fulfilled' ? [[r.value.id, r.value.average]] : []))));
      setOutstanding(Object.fromEntries(results.flatMap((r) => (r.status === 'fulfilled' ? [[r.value.id, r.value.outstanding]] : []))));
    }

    if (children.length) void loadSnapshot();

    return () => {
      cancelled = true;
    };
  }, [children]);

  if (loading && children.length === 0) return <Loading label="Chargement de vos enfants…" />;

  const firstName = (user?.name ?? '').trim().split(/\s+/)[0];
  const schoolName = meta.data?.school?.name;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={false} onRefresh={reload} tintColor={theme.accent} />}
    >
      <Text style={styles.greeting}>Bonjour, {firstName} 👋</Text>
      <Text style={styles.dateLine}>{schoolName ?? 'Espace parent'}</Text>

      {error && children.length === 0 ? (
        <ErrorState message={error} onRetry={reload} />
      ) : children.length === 0 ? (
        <Empty
          title="Aucun enfant lié"
          sub="La direction de l’établissement doit lier votre compte à vos enfants. Contactez le secrétariat."
        />
      ) : (
        <>
          <SectionHeader title={children.length > 1 ? 'Mes enfants' : 'Mon enfant'} />
          {children.map((child) => {
            const average = averages[child.id];
            const due = outstanding[child.id];

            return (
              <Card key={child.id} style={styles.childCard}>
                <View style={styles.childTop}>
                  <Avatar name={fullName(child)} size={52} />
                  <View style={styles.childInfo}>
                    <Text style={styles.childName}>{fullName(child)}</Text>
                    <Text style={styles.childMeta}>
                      {child.matricule ?? 'Sans matricule'} · {child.school_class?.name ?? 'Sans classe'}
                    </Text>
                  </View>
                </View>
                <View style={styles.snapshotRow}>
                  <Snapshot
                    label="Moyenne générale"
                    value={average != null ? `${average.toFixed(2)} / 20` : '—'}
                    tone={average != null && average >= 10 ? theme.ok : average != null ? theme.danger : theme.faint}
                  />
                  <Snapshot
                    label="En attente"
                    value={due != null ? money(due) : '—'}
                    tone={due != null && due > 0 ? theme.copper : theme.ok}
                  />
                </View>
                <View style={styles.childActions}>
                  <ActionButton
                    label="Bulletin"
                    onPress={() => {
                      select(child.id);
                      navigation.navigate('Bulletin');
                    }}
                  />
                  <ActionButton
                    label="Absences"
                    onPress={() => {
                      select(child.id);
                      navigation.navigate('Absences');
                    }}
                  />
                  <ActionButton
                    label="Finances"
                    onPress={() => {
                      select(child.id);
                      navigation.navigate('Finances');
                    }}
                  />
                </View>
              </Card>
            );
          })}
        </>
      )}

      <SectionHeader title="Messagerie" />
      <Card onPress={() => navigation.navigate('Messages')} style={styles.messageCard}>
        <Text style={styles.messageTitle}>Écrire à l’école</Text>
        <Text style={styles.messageSub}>Questions sur la scolarité, les absences ou la facturation : adressez-vous à la direction.</Text>
        <Text style={styles.messageLink}>Ouvrir la messagerie →</Text>
      </Card>

      <View style={styles.footerSpace} />
    </ScrollView>
  );
}

function Snapshot({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <View style={styles.snapshot}>
      <Text style={styles.snapshotLabel}>{label.toUpperCase()}</Text>
      <Text style={[styles.snapshotValue, { color: tone }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

function ActionButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  content: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 40 },
  greeting: { color: theme.ink, fontSize: 21, fontWeight: '800' },
  dateLine: { color: theme.faint, fontSize: 12, marginTop: 2, marginBottom: 10 },
  childCard: { marginBottom: 12, gap: 14 },
  childTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  childInfo: { flex: 1 },
  childName: { color: theme.ink, fontSize: 16.5, fontWeight: '800' },
  childMeta: { color: theme.faint, fontSize: 11, marginTop: 3 },
  snapshotRow: { flexDirection: 'row', gap: 10 },
  snapshot: {
    flex: 1,
    backgroundColor: theme.surfaceSoft,
    borderRadius: theme.radiusSm,
    borderWidth: 1,
    borderColor: theme.line,
    padding: 10,
    gap: 3,
  },
  snapshotLabel: { color: theme.faint, fontSize: 8, letterSpacing: 0.9, fontWeight: '700' },
  snapshotValue: { fontSize: 15, fontWeight: '800' },
  childActions: { flexDirection: 'row', gap: 8 },
  actionButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.lineStrong,
    borderRadius: theme.radiusSm,
    paddingVertical: 10,
    alignItems: 'center',
  },
  actionPressed: { backgroundColor: theme.surfaceAlt },
  actionLabel: { color: theme.ink, fontSize: 12, fontWeight: '700' },
  messageCard: { gap: 4 },
  messageTitle: { color: theme.ink, fontSize: 14.5, fontWeight: '800' },
  messageSub: { color: theme.faint, fontSize: 11.5, lineHeight: 16 },
  messageLink: { color: theme.accent, fontSize: 12, fontWeight: '700', marginTop: 6 },
  footerSpace: { height: 24 },
});
