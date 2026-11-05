/**
 * Accueil premium (Direction & personnel) : salutation, KPI vitreux,
 * actions rapides, agenda du jour, effectifs, dernières inscriptions.
 */
import React from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useApiQuery } from '../useApiQuery';
import { api } from '../api';
import { theme } from '../theme';
import {
  Aurora,
  Avatar,
  Card,
  ErrorState,
  Loading,
  ProgressBar,
  ScreenHeader,
  SectionHeader,
  StatTile,
} from '../ui';
import { formatHour, money, fullName, formatDate } from '../format';
import { useAuth } from '../auth';
import type { DashboardResponse } from '../types';
import type { RootStackParamList, TabsParamList } from '../RootNavigator';

const ACCENTS = [theme.accent, theme.ok, theme.copper, '#8F7BFF'];

type Nav = NativeStackNavigationProp<RootStackParamList & TabsParamList>;

export default function StaffHomeScreen({ role }: { role: 'direction' | 'secretariat' | 'comptable' | 'enseignant' }) {
  const navigation = useNavigation<Nav>();
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

  const quickActions: { icon: keyof typeof Ionicons.glyphMap; label: string; go: () => void }[] = [
    ...(role === 'enseignant'
      ? [
          { icon: 'create-outline' as const, label: 'Notes', go: () => navigation.navigate('Notes') },
          { icon: 'checkbox-outline' as const, label: 'Appel', go: () => navigation.navigate('Appel') },
        ]
      : [{ icon: 'people-outline' as const, label: 'Élèves', go: () => navigation.navigate('Eleves') }]),
    { icon: 'calendar-outline', label: 'Emploi', go: () => navigation.navigate('Horaire') },
    ...(canSeeFinance
      ? [{ icon: 'card-outline' as const, label: 'Factures', go: () => navigation.navigate('Finances') }]
      : []),
    { icon: 'chatbubble-ellipses-outline', label: 'Messages', go: () => navigation.navigate('Messages') },
  ];

  return (
    <View style={styles.screen}>
      <Aurora dense />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={reload} tintColor={theme.accent} />}
      >
        <ScreenHeader
          title={`Bonjour, ${firstName}`}
          sub={`${data.school?.name ?? 'Kalanso'} · ${formatDate(new Date().toISOString())}`}
          right={(
            <Pressable
              onPress={() => navigation.navigate('Compte')}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Ouvrir mon compte"
            >
              <Avatar name={user?.name} size={44} ring />
            </Pressable>
          )}
        />

        <View style={styles.statsRow}>
          <StatTile value={String(data.kpis.students)} label="Élèves" />
          <StatTile value={`${data.kpis.attendance} %`} label="Présence" tone="ok" />
          {canSeeFinance && data.kpis.recovery != null ? (
            <StatTile value={money(data.kpis.recovery)} label="Encaissé" tone="copper" />
          ) : (
            <StatTile value={String(data.kpis.classes)} label="Classes" tone="muted" />
          )}
        </View>

        <View style={styles.quickRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickScroll}>
            {quickActions.map((action) => (
              <Pressable
                key={action.label}
                onPress={action.go}
                accessibilityRole="button"
                style={({ pressed }) => [styles.quickChip, pressed && styles.quickPressed]}
              >
                <Ionicons name={action.icon} size={16} color={theme.copper} />
                <Text style={styles.quickLabel}>{action.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <SectionHeader title="Aujourd’hui" />
        <Card style={styles.timelineCard}>
          {data.today.length === 0 ? (
            <Text style={styles.mutedText}>Aucun cours planifié aujourd’hui.</Text>
          ) : (
            data.today.map((slot, index) => (
              <View key={slot.id} style={[styles.slotRow, index > 0 && styles.slotRowBorder]}>
                <Text style={styles.slotTime}>{formatHour(slot.starts_at)}</Text>
                <View style={[styles.slotBar, { backgroundColor: ACCENTS[index % ACCENTS.length] }]} />
                <View style={styles.slotBody}>
                  <Text style={styles.slotSubject} numberOfLines={1}>
                    {slot.subject?.name ?? 'Cours'}
                  </Text>
                  <Text style={styles.slotMeta} numberOfLines={1}>
                    {slot.schoolClass?.name ?? '—'}
                    {slot.schoolClass?.room ? ` · Salle ${slot.schoolClass.room}` : ''}
                    {slot.staff ? ` · ${slot.staff.first_name} ${slot.staff.last_name}` : ''}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={15} color={theme.ghost} />
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
                  <ProgressBar value={row.value} max={maxEffectif} />
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
              <Pressable
                key={student.id}
                onPress={() => navigation.navigate('Eleve', { studentId: student.id })}
                style={[styles.recentRow, index > 0 && styles.slotRowBorder]}
              >
                <Avatar name={fullName(student)} size={38} ring />
                <View style={styles.slotBody}>
                  <Text style={styles.slotSubject} numberOfLines={1}>{fullName(student)}</Text>
                  <Text style={styles.slotMeta} numberOfLines={1}>
                    {student.matricule ?? 'Sans matricule'} · {student.school_class?.name ?? 'Sans classe'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={15} color={theme.ghost} />
              </Pressable>
            ))
          )}
        </Card>

        <View style={styles.footerSpace} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  fill: { flex: 1, backgroundColor: theme.bg },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  statsRow: { flexDirection: 'row', gap: 9, marginTop: 8 },
  quickRow: { marginTop: 14, marginHorizontal: -16 },
  quickScroll: { gap: 9, paddingHorizontal: 16, paddingVertical: 2 },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.line,
  },
  quickPressed: { opacity: 0.75 },
  quickLabel: { color: theme.inkSoft, fontSize: 12.5, fontWeight: '700' },
  timelineCard: { paddingHorizontal: 14 },
  mutedText: { color: theme.faint, fontSize: 12.5, paddingVertical: 6 },
  slotRow: { flexDirection: 'row', gap: 11, paddingVertical: 11, alignItems: 'center' },
  slotRowBorder: { borderTopWidth: 1, borderTopColor: theme.line },
  slotTime: {
    color: theme.accent,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
    fontSize: 13,
    width: 42,
  },
  slotBar: { width: 3.5, height: 30, borderRadius: 2 },
  slotBody: { flex: 1 },
  slotSubject: { color: theme.ink, fontSize: 13.5, fontWeight: '700' },
  slotMeta: { color: theme.faint, fontSize: 10.5, marginTop: 2 },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 7 },
  levelLabel: { width: 78, color: theme.inkSoft, fontSize: 11.5, fontWeight: '600' },
  levelValue: { width: 34, textAlign: 'right', color: theme.faint, fontSize: 11, fontVariant: ['tabular-nums'] },
  recentRow: { flexDirection: 'row', gap: 12, paddingVertical: 9, alignItems: 'center' },
  footerSpace: { height: 24 },
});
