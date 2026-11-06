/**
 * Fiche élève premium : héros identité, tuiles de statistiques,
 * onglets segmentés (Aperçu / Notes / Absences / Finances).
 */
import React, { useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { api, fileUrl } from '../api';
import { theme } from '../theme';
import {
  Avatar,
  Card,
  Empty,
  ErrorState,
  Loading,
  Pill,
  ProgressBar,
  ScreenHeader,
  SectionHeader,
  SegmentedTabs,
  StatTile,
} from '../ui';
import { evaluationLabel, formatDate, fullName, money } from '../format';
import { useApiQuery } from '../useApiQuery';
import type { RootStackParamList } from '../RootNavigator';

interface StudentDetail {
  student: {
    id: number;
    matricule: string | null;
    first_name: string;
    last_name: string;
    gender: string | null;
    status: string | null;
    birth_date: string | null;
    enrolled_on: string | null;
    guardian_name?: string | null;
    guardian_phone?: string | null;
    photos?: { id: number; student_id: number; filename: string; url?: string }[];
    school_class?: { name: string; level: string | null; room: string | null } | null;
    grades?: {
      id: number;
      evaluation: string;
      score: string | number;
      max_score: string | number;
      subject?: { name: string; coefficient: string | number } | null;
      term?: { name: string } | null;
    }[];
    absences?: { id: number; date: string; reason: string | null; is_justified: boolean }[];
    invoices?: { status: string; amount: string | number; paid_amount?: string | number }[];
  };
  summary: {
    average: number | null;
    absences: number;
    unjustified_absences: number;
    outstanding?: number;
  };
}

const TABS = ['Aperçu', 'Notes', 'Absences', 'Finances'] as const;
type Tab = (typeof TABS)[number];

export default function StudentDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'Eleve'>>();
  const { studentId } = route.params;
  const [tab, setTab] = useState<Tab>('Aperçu');
  const detail = useApiQuery<StudentDetail>(
    () => api.get<StudentDetail>(`/students/${studentId}`),
    [studentId],
  );

  const subjectAverages = useMemo(() => {
    const grades = detail.data?.student.grades ?? [];
    const bySubject = new Map<string, { total: number; count: number }>();
    for (const grade of grades) {
      const name = grade.subject?.name ?? 'Matière';
      const entry = bySubject.get(name) ?? { total: 0, count: 0 };
      entry.total += Number(grade.score) || 0;
      entry.count += 1;
      bySubject.set(name, entry);
    }

    return [...bySubject.entries()]
      .map(([name, { total, count }]) => ({ name, average: count ? total / count : 0 }))
      .sort((a, b) => b.average - a.average);
  }, [detail.data]);

  if (detail.loading && !detail.data) return <Loading />;
  if (!detail.data) {
    return (
      <View style={styles.fill}>
        <ErrorState message={detail.error ?? undefined} onRetry={detail.reload} />
      </View>
    );
  }

  const { student, summary } = detail.data;
  const name = fullName(student);
  const recentGrades = (student.grades ?? []).slice().reverse();
  const absences = student.absences ?? [];
  const invoices = student.invoices ?? [];

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Fiche élève" sub={student.school_class?.name ?? undefined} />

        <View style={styles.hero}>
          <Avatar
            name={name}
            size={96}
            ring
            uri={fileUrl(student.photos?.[0]?.url ?? student.photos?.[0]?.filename)}
          />
          <Text style={styles.heroName}>{name}</Text>
          <Text style={styles.heroMeta}>
            {student.school_class?.name ?? 'Sans classe'}
            {student.matricule ? ` · N° ${student.matricule}` : ''}
          </Text>
          <View style={styles.heroPills}>
            {student.status ? <Pill label={student.status} tone="accent" /> : null}
            {student.gender ? <Pill label={student.gender === 'F' ? 'Féminin' : 'Masculin'} tone="muted" /> : null}
          </View>
          {student.guardian_phone ? (
            <Pressable
              onPress={() => void Linking.openURL(`tel:${student.guardian_phone}`)}
              accessibilityRole="button"
              accessibilityLabel={`Appeler le parent${student.guardian_name ? ` (${student.guardian_name})` : ''}`}
              style={({ pressed }) => [styles.callButton, pressed && styles.callButtonPressed]}
            >
              <Ionicons name="call-outline" size={16} color="#cdd8ff" />
              <Text style={styles.callButtonText}>
                Appeler le parent{student.guardian_name ? ` · ${student.guardian_name}` : ''}
              </Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.statsRow}>
          <StatTile
            value={summary.average != null ? summary.average.toFixed(1) : '—'}
            label="Moyenne / 20"
            trend={summary.average != null && summary.average >= 10 ? '↑' : undefined}
          />
          <StatTile value={String(summary.absences)} label="Absences" tone="muted" />
          {summary.outstanding != null && summary.outstanding > 0 ? (
            <StatTile value={money(summary.outstanding)} label="Solde dû" tone="danger" />
          ) : (
            <StatTile value="0 F" label="Solde" tone="ok" />
          )}
        </View>

        <View style={styles.tabsWrap}>
          <SegmentedTabs
            tabs={[...TABS]}
            active={tab}
            onChange={(next) => setTab(next as Tab)}
          />
        </View>

        {tab === 'Aperçu' ? (
          <>
            <SectionHeader title="Matières" />
            <Card>
              {subjectAverages.length === 0 ? (
                <Empty title="Aucune note" sub="Aucune note enregistrée pour cet élève." />
              ) : (
                subjectAverages.map((row, index) => (
                  <View key={row.name} style={[styles.subjectRow, index > 0 && styles.lineBorder]}>
                    <View style={styles.subjectHead}>
                      <Text style={styles.subjectName} numberOfLines={1}>{row.name}</Text>
                      <Text style={styles.subjectScore}>{row.average.toFixed(1)}</Text>
                    </View>
                    <ProgressBar value={row.average} max={20} />
                  </View>
                ))
              )}
            </Card>
            {student.enrolled_on ? (
              <Text style={styles.footNote}>Inscrit le {formatDate(student.enrolled_on)}</Text>
            ) : null}
          </>
        ) : null}

        {tab === 'Notes' ? (
          <>
            <SectionHeader title={`Notes (${recentGrades.length})`} />
            {recentGrades.length === 0 ? (
              <Empty title="Aucune note" sub="Aucune note enregistrée pour cet élève." />
            ) : (
              <Card>
                {recentGrades.map((grade, index) => (
                  <View key={grade.id} style={[styles.lineRow, index > 0 && styles.lineBorder]}>
                    <View style={styles.lineBody}>
                      <Text style={styles.lineTitle}>{grade.subject?.name ?? 'Matière'} · {evaluationLabel(grade.evaluation)}</Text>
                      <Text style={styles.lineMeta}>{grade.term?.name ?? ''}</Text>
                    </View>
                    <View style={styles.scoreBadge}>
                      <Text style={styles.scoreText}>{grade.score}</Text>
                      <Text style={styles.scoreMax}>/ {grade.max_score}</Text>
                    </View>
                  </View>
                ))}
              </Card>
            )}
          </>
        ) : null}

        {tab === 'Absences' ? (
          <>
            <SectionHeader title={`Absences (${absences.length})`} />
            {absences.length === 0 ? (
              <Empty title="Aucune absence" sub="Cet élève n'a aucune absence enregistrée." />
            ) : (
              <Card>
                {absences.map((absence, index) => (
                  <View key={absence.id} style={[styles.lineRow, index > 0 && styles.lineBorder]}>
                    <View style={styles.lineBody}>
                      <Text style={styles.lineTitle}>{absence.reason?.trim() || 'Absence'}</Text>
                      <Text style={styles.lineMeta}>{formatDate(absence.date)}</Text>
                    </View>
                    <Pill
                      label={absence.is_justified ? 'Justifiée' : 'Non justifiée'}
                      tone={absence.is_justified ? 'ok' : 'copper'}
                    />
                  </View>
                ))}
              </Card>
            )}
          </>
        ) : null}

        {tab === 'Finances' ? (
          <>
            <SectionHeader title={`Factures (${invoices.length})`} />
            {invoices.length === 0 ? (
              <Empty title="Aucune facture" sub="Aucune facture émise pour cet élève." />
            ) : (
              <Card>
                {invoices.map((invoice, index) => {
                  const amount = Number(invoice.amount) || 0;
                  const paid = Number(invoice.paid_amount ?? 0) || 0;

                  return (
                    <View key={`${invoice.status}-${index}`} style={[styles.lineRow, index > 0 && styles.lineBorder]}>
                      <View style={styles.lineBody}>
                        <Text style={styles.lineTitle}>{money(amount)}</Text>
                        <Text style={styles.lineMeta}>Réglé : {money(paid)}</Text>
                      </View>
                      <Pill
                        label={invoice.status === 'paid' ? 'Payée' : invoice.status === 'overdue' ? 'En retard' : 'En attente'}
                        tone={invoice.status === 'paid' ? 'ok' : invoice.status === 'overdue' ? 'danger' : 'copper'}
                      />
                    </View>
                  );
                })}
              </Card>
            )}
          </>
        ) : null}

        <View style={styles.footerSpace} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  fill: { flex: 1, backgroundColor: theme.bg },
  content: { paddingHorizontal: 16, paddingBottom: 44 },
  hero: { alignItems: 'center', marginTop: 10, marginBottom: 6 },
  heroName: { color: theme.ink, fontSize: 23, fontWeight: '800', letterSpacing: -0.3, marginTop: 12 },
  heroMeta: { color: theme.faint, fontSize: 12.5, marginTop: 4 },
  heroPills: { flexDirection: 'row', gap: 8, marginTop: 10 },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.lineStrong,
    backgroundColor: 'rgba(91, 124, 250, 0.12)',
  },
  callButtonPressed: { backgroundColor: 'rgba(91, 124, 250, 0.22)' },
  callButtonText: { color: '#cdd8ff', fontSize: 12.5, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 9, marginTop: 14 },
  tabsWrap: { marginTop: 20, marginHorizontal: -4 },
  subjectRow: { paddingVertical: 10, gap: 8 },
  subjectHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  subjectName: { color: theme.inkSoft, fontSize: 13, fontWeight: '600', flex: 1 },
  subjectScore: { color: theme.ink, fontSize: 14.5, fontWeight: '800', fontVariant: ['tabular-nums'] },
  footNote: { color: theme.ghost, fontSize: 10.5, textAlign: 'center', marginTop: 12 },
  lineRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  lineBorder: { borderTopWidth: 1, borderTopColor: theme.line },
  lineBody: { flex: 1 },
  lineTitle: { color: theme.ink, fontSize: 12.5, fontWeight: '600' },
  lineMeta: { color: theme.faint, fontSize: 10, marginTop: 2 },
  scoreBadge: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  scoreText: { color: theme.ink, fontWeight: '800', fontVariant: ['tabular-nums'], fontSize: 15 },
  scoreMax: { color: theme.ghost, fontSize: 10, fontWeight: '600' },
  footerSpace: { height: 24 },
});
