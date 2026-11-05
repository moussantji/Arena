/** Accueil parent : enfants liés, aperçu du trimestre et raccourcis. */
import React, { useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../auth';
import { useChildren } from '../children';
import { api } from '../api';
import { theme } from '../theme';
import {
  Avatar,
  Card,
  Empty,
  ErrorState,
  HomeHero,
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
      <HomeHero
        overline={schoolName ?? 'Espace parent'}
        title={`Bonjour, ${firstName}`}
        icon="school-outline"
      />

      {error && children.length === 0 ? (
        <ErrorState message={error} onRetry={reload} />
      ) : children.length === 0 ? (
        <Empty
          icon="people-outline"
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
                    icon="document-text-outline"
                    onPress={() => {
                      select(child.id);
                      navigation.navigate('Bulletin');
                    }}
                  />
                  <ActionButton
                    label="Absences"
                    icon="calendar-clear-outline"
                    onPress={() => {
                      select(child.id);
                      navigation.navigate('Absences');
                    }}
                  />
                  <ActionButton
                    label="Finances"
                    icon="wallet-outline"
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
        <View style={styles.messageRow}>
          <View style={styles.messageIconChip}>
            <Ionicons name="chatbubbles-outline" size={20} color="#a8baff" />
          </View>
          <View style={styles.messageTextBlock}>
            <Text style={styles.messageTitle}>Écrire à l’école</Text>
            <Text style={styles.messageSub}>Questions sur la scolarité, les absences ou la facturation : adressez-vous à la direction.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.faint} />
        </View>
      </Card>

      <View style={styles.footerSpace} />
    </ScrollView>
  );
}

function Snapshot({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <LinearGradient
      colors={['#171e44', '#131a3c']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.snapshot}
    >
      <Text style={styles.snapshotLabel}>{label.toUpperCase()}</Text>
      <Text style={[styles.snapshotValue, { color: tone }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </LinearGradient>
  );
}

function ActionButton({ label, icon, onPress }: { label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}>
      <Ionicons name={icon} size={15} color="#a8baff" />
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  content: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 112 },
  childCard: { marginBottom: 12, gap: 14 },
  childTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  childInfo: { flex: 1 },
  childName: { color: theme.ink, fontSize: 16.5, fontWeight: '800' },
  childMeta: { color: theme.faint, fontSize: 11, marginTop: 3 },
  snapshotRow: { flexDirection: 'row', gap: 10 },
  snapshot: {
    flex: 1,
    borderRadius: theme.radiusSm,
    borderWidth: 1,
    borderColor: 'rgba(167, 182, 255, 0.16)',
    padding: 11,
    gap: 4,
  },
  snapshotLabel: { color: theme.faint, fontSize: 8, letterSpacing: 0.9, fontWeight: '700' },
  snapshotValue: { fontSize: 15, fontWeight: '800' },
  childActions: { flexDirection: 'row', gap: 8 },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    borderWidth: 1,
    borderColor: theme.lineStrong,
    borderRadius: theme.radiusSm,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(167, 182, 255, 0.04)',
  },
  actionPressed: { backgroundColor: theme.surfaceAlt },
  actionLabel: { color: theme.ink, fontSize: 12, fontWeight: '700' },
  messageCard: { gap: 4 },
  messageRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  messageIconChip: {
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(109, 139, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(109, 139, 255, 0.35)',
  },
  messageTextBlock: { flex: 1, gap: 3 },
  messageTitle: { color: theme.ink, fontSize: 14.5, fontWeight: '800' },
  messageSub: { color: theme.faint, fontSize: 11.5, lineHeight: 16 },
  footerSpace: { height: 24 },
});
