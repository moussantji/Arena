/** Accueil du personnel : indicateurs, emploi du temps du jour, dernières inscriptions. */
import React from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useApiQuery } from '../useApiQuery';
import { api } from '../api';
import { theme } from '../theme';
import {
  Avatar,
  Card,
  ErrorState,
  Loading,
  SectionHeader,
  StatCard,
} from '../ui';
import { formatHour, money, fullName, formatDate } from '../format';
import { useAuth } from '../auth';
import type { DashboardResponse } from '../types';
import type { TabsParamList } from '../RootNavigator';

export default function StaffHomeScreen({ role }: { role: 'direction' | 'secretariat' | 'comptable' | 'enseignant' }) {
  const navigation = useNavigation<{ navigate(name: keyof TabsParamList): void }>();
  const { user } = useAuth();
  const canSeeFinance = role === 'direction' || role === 'comptable';
  const { data, error, loading, reload } = useApiQuery<DashboardResponse>(
    () => api.get<DashboardResponse>('/dashboard'),
    [role],
  );

  if (loading && !data) return <Loading />;
  if (!data) return <View style={styles.fill}><ErrorState message={error ?? undefined} onRetry={reload} /></View>;

  const firstName = (user?.name ?? '').trim().split(/\s+/)[0] || 'Bonjour';
  const maxEffectif = Math.max(1, ...data.class_distribution.map((row) => row.value));

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={false} onRefresh={reload} tintColor={theme.accent} />}
    >
      <Text style={styles.greeting}>Bonjour, {firstName} 👋</Text>
      <Text style={styles.dateLine}>{formatDate(new Date().toISOString())}</Text>

      <View style={styles.statsRow}>
        <StatCard label="Élèves actifs" value={String(data.kpis.students)} tone="accent" />
        <StatCard label="Classes" value={String(data.kpis.classes)} tone="muted" />
      </View>
      <View style={styles.statsRow}>
        <StatCard label="Assiduité (mois)" value={`${data.kpis.attendance} %`} tone={data.kpis.attendance >= 90 ? 'ok' : 'copper'} />
        {canSeeFinance && data.kpis.recovery != null ? (
          <StatCard label="Recettes (année)" value={money(data.kpis.recovery)} tone="copper" />
        ) : (
          <StatCard label="Bulletins" value="Trimestre courant" tone="muted" />
        )}
      </View>

      {role === 'enseignant' && (
        <>
          <SectionHeader title="Actions rapides" />
          <View style={styles.quickRow}>
            <QuickAction label="Saisir mes notes" hint="Devoirs & compositions" onPress={() => navigation.navigate('Notes')} />
            <QuickAction label="Faire l'appel" hint="Absences du jour" onPress={() => navigation.navigate('Appel')} />
          </View>
        </>
      )}

      <SectionHeader title="Aujourd'hui" />
      <Card>
        {data.today.length === 0 ? (
          <Text style={styles.mutedText}>Aucun cours planifié aujourd’hui.</Text>
        ) : (
          data.today.map((slot, index) => (
            <View key={slot.id} style={[styles.slotRow, index > 0 && styles.slotRowBorder]}>
              <Text style={styles.slotTime}>{formatHour(slot.starts_at)}</Text>
              <View style={styles.slotBody}>
                <Text style={styles.slotSubject} numberOfLines={1}>
                  {slot.subject?.name ?? 'Cours'} · {slot.schoolClass?.name ?? '—'}
                </Text>
                <Text style={styles.slotMeta} numberOfLines={1}>
                  {slot.ends_at ? `Fin ${formatHour(slot.ends_at)}` : ''}
                  {slot.staff ? ` · ${slot.staff.first_name} ${slot.staff.last_name}` : ''}
                  {slot.schoolClass?.room ? ` · Salle ${slot.schoolClass.room}` : ''}
                </Text>
              </View>
            </View>
          ))
        )}
      </Card>

      {data.class_distribution.length > 0 && (
        <>
          <SectionHeader title="Effectifs par niveau" />
          <Card>
            {data.class_distribution.slice(0, 6).map((row) => (
              <View key={row.label} style={styles.levelRow}>
                <Text style={styles.levelLabel} numberOfLines={1}>{row.label}</Text>
                <View style={styles.levelTrack}>
                  <View style={[styles.levelFill, { width: `${Math.round((row.value / maxEffectif) * 100)}%` }]} />
                </View>
                <Text style={styles.levelValue}>{row.value}</Text>
              </View>
            ))}
          </Card>
        </>
      )}

      <SectionHeader title="Dernières inscriptions" />
      <Card>
        {data.recent_students.length === 0 ? (
          <Text style={styles.mutedText}>Aucune inscription récente.</Text>
        ) : (
          data.recent_students.map((student, index) => (
            <View key={student.id} style={[styles.recentRow, index > 0 && styles.slotRowBorder]}>
              <Avatar name={fullName(student)} size={36} />
              <View style={styles.slotBody}>
                <Text style={styles.slotSubject} numberOfLines={1}>{fullName(student)}</Text>
                <Text style={styles.slotMeta} numberOfLines={1}>
                  {student.matricule ?? 'Sans matricule'} · {student.school_class?.name ?? 'Sans classe'}
                </Text>
              </View>
            </View>
          ))
        )}
      </Card>

      <View style={styles.footerSpace} />
    </ScrollView>
  );
}

function QuickAction({ label, hint, onPress }: { label: string; hint: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.quickCard, pressed && styles.quickPressed]}>
      <Text style={styles.quickLabel}>{label}</Text>
      <Text style={styles.quickHint}>{hint}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  fill: { flex: 1, backgroundColor: theme.bg },
  content: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 40 },
  greeting: { color: theme.ink, fontSize: 21, fontWeight: '800' },
  dateLine: { color: theme.faint, fontSize: 12, marginTop: 2, marginBottom: 12 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  quickRow: { flexDirection: 'row', gap: 10 },
  quickCard: {
    flex: 1,
    backgroundColor: theme.accentSoft,
    borderColor: 'rgba(109, 139, 255, 0.35)',
    borderWidth: 1,
    borderRadius: theme.radius,
    padding: 14,
    gap: 3,
  },
  quickPressed: { opacity: 0.8 },
  quickLabel: { color: '#dfe6ff', fontSize: 13.5, fontWeight: '700' },
  quickHint: { color: theme.faint, fontSize: 10.5 },
  mutedText: { color: theme.faint, fontSize: 12.5 },
  slotRow: { flexDirection: 'row', gap: 12, paddingVertical: 9, alignItems: 'center' },
  slotRowBorder: { borderTopWidth: 1, borderTopColor: theme.line },
  slotTime: { color: theme.accent, fontVariant: ['tabular-nums'], fontWeight: '800', fontSize: 14, width: 44 },
  slotBody: { flex: 1 },
  slotSubject: { color: theme.ink, fontSize: 13, fontWeight: '700' },
  slotMeta: { color: theme.faint, fontSize: 10.5, marginTop: 1 },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 },
  levelLabel: { width: 74, color: theme.ink, fontSize: 11.5, fontWeight: '600' },
  levelTrack: {
    flex: 1, height: 8, borderRadius: 4, backgroundColor: theme.surfaceAlt, overflow: 'hidden',
  },
  levelFill: { height: 8, borderRadius: 4, backgroundColor: theme.accentStrong },
  levelValue: { width: 34, textAlign: 'right', color: theme.faint, fontSize: 11, fontVariant: ['tabular-nums'] },
  recentRow: { flexDirection: 'row', gap: 12, paddingVertical: 8, alignItems: 'center' },
  footerSpace: { height: 24 },
});
