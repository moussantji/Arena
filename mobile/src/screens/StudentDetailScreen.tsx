/** Fiche élève (personnel) : identité, moyennes, absences récentes. */
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { api } from '../api';
import { theme } from '../theme';
import { Avatar, Card, Empty, ErrorState, Loading, SectionHeader, Pill } from '../ui';
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

export default function StudentDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'Eleve'>>();
  const { studentId } = route.params;
  const detail = useApiQuery<StudentDetail>(
    () => api.get<StudentDetail>(`/students/${studentId}`),
    [studentId],
  );

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
  const recentGrades = (student.grades ?? []).slice(-6).reverse();
  const recentAbsences = student.absences ?? [];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card style={styles.identityCard}>
        <Avatar name={name} size={64} />
        <View style={styles.identityBody}>
          <Text style={styles.identityName}>{name}</Text>
          <Text style={styles.identityMeta}>
            {student.matricule ?? 'Sans matricule'} · {student.school_class?.name ?? 'Sans classe'}
          </Text>
          <View style={styles.identityPills}>
            {student.status ? <Pill label={student.status} tone="accent" /> : null}
            {student.gender ? <Pill label={student.gender === 'F' ? 'Féminin' : 'Masculin'} tone="muted" /> : null}
            {student.enrolled_on ? <Pill label={`Inscrit le ${formatDate(student.enrolled_on)}`} tone="muted" /> : null}
          </View>
        </View>
      </Card>

      <SectionHeader title="Assiduité & résultats" />
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{summary.average != null ? summary.average.toFixed(2) : '—'}</Text>
          <Text style={styles.statLabel}>MOYENNE / 20</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{summary.absences}</Text>
          <Text style={styles.statLabel}>ABSENCES</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={[styles.statValue, summary.unjustified_absences > 0 && styles.statDanger]}>
            {summary.unjustified_absences}
          </Text>
          <Text style={styles.statLabel}>NON JUSTIFIÉES</Text>
        </Card>
      </View>
      {summary.outstanding != null && summary.outstanding > 0 ? (
        <Card style={styles.outstandingCard}>
          <Text style={styles.outstandingLabel}>SOLDE EN ATTENTE</Text>
          <Text style={styles.outstandingValue}>{money(summary.outstanding)}</Text>
        </Card>
      ) : null}

      <SectionHeader title="Dernières notes" />
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
              <Text style={styles.lineScore}>{grade.score} / {grade.max_score}</Text>
            </View>
          ))}
        </Card>
      )}

      <SectionHeader title="Absences récentes" />
      {recentAbsences.length === 0 ? (
        <Empty title="Aucune absence" sub="Cet élève n'a aucune absence enregistrée." />
      ) : (
        <Card>
          {recentAbsences.map((absence, index) => (
            <View key={absence.id} style={[styles.lineRow, index > 0 && styles.lineBorder]}>
              <View style={styles.lineBody}>
                <Text style={styles.lineTitle}>{absence.reason?.trim() || 'Absence'}</Text>
                <Text style={styles.lineMeta}>{formatDate(absence.date)}</Text>
              </View>
              <Pill label={absence.is_justified ? 'Justifiée' : 'Non justifiée'} tone={absence.is_justified ? 'ok' : 'copper'} />
            </View>
          ))}
        </Card>
      )}

      <View style={styles.footerSpace} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  fill: { flex: 1, backgroundColor: theme.bg },
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 44 },
  identityCard: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  identityBody: { flex: 1, gap: 5 },
  identityName: { color: theme.ink, fontSize: 18, fontWeight: '800' },
  identityMeta: { color: theme.faint, fontSize: 11 },
  identityPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 8 },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  statValue: { color: theme.ink, fontSize: 19, fontWeight: '800', fontVariant: ['tabular-nums'] },
  statDanger: { color: theme.danger },
  statLabel: { color: theme.faint, fontSize: 7.5, letterSpacing: 0.8, fontWeight: '700', marginTop: 3 },
  outstandingCard: { marginTop: 10, borderColor: 'rgba(217, 176, 111, 0.45)' },
  outstandingLabel: { color: theme.faint, fontSize: 8.5, letterSpacing: 1.2, fontWeight: '700' },
  outstandingValue: { color: theme.copper, fontSize: 22, fontWeight: '800', marginTop: 2 },
  lineRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9 },
  lineBorder: { borderTopWidth: 1, borderTopColor: theme.line },
  lineBody: { flex: 1 },
  lineTitle: { color: theme.ink, fontSize: 12.5, fontWeight: '600' },
  lineMeta: { color: theme.faint, fontSize: 10, marginTop: 2 },
  lineScore: { color: theme.ink, fontWeight: '800', fontVariant: ['tabular-nums'], fontSize: 14 },
  footerSpace: { height: 24 },
});
