/** Bulletin de l'enfant lié : moyennes par matière, moyenne générale, rang et mention. */
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useChildren, ChildSelector } from '../children';
import { api } from '../api';
import { theme } from '../theme';
import { Card, CardTitle, Empty, ErrorState, Loading, SectionHeader, Pill } from '../ui';
import { evaluationLabel, fullName } from '../format';
import type { Bulletin, ParentMeta, Term } from '../types';
import { useApiQuery } from '../useApiQuery';

export default function ReportCardScreen() {
  const { selectedChild, loading: childrenLoading, error: childrenError, reload: reloadChildren } = useChildren();
  const meta = useApiQuery<ParentMeta>(() => api.get<ParentMeta>('/parent/meta'), []);

  const terms = useMemo(() => meta.data?.terms ?? [], [meta.data]);
  const [termId, setTermId] = useState<number | null>(null);
  const activeTermId = termId ?? meta.data?.term?.id ?? terms[0]?.id ?? null;

  const bulletin = useApiQuery<Bulletin | null>(
    () => (selectedChild
      ? api.get<Bulletin>(`/parent/children/${selectedChild.id}/report-card${activeTermId ? `?term_id=${activeTermId}` : ''}`)
      : Promise.resolve(null)),
    [selectedChild?.id, activeTermId],
  );

  if (childrenLoading && !selectedChild) return <Loading label="Chargement…" />;
  if (!selectedChild) {
    return (
      <View style={styles.fill}>
        <ErrorState message={childrenError ?? 'Aucun enfant lié à votre compte.'} onRetry={reloadChildren} />
      </View>
    );
  }

  const data = bulletin.data;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ChildSelector />
      <Text style={styles.childName}>{fullName(selectedChild)}</Text>
      <Text style={styles.childMeta}>{selectedChild.school_class?.name ?? 'Sans classe'}</Text>

      {terms.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.termRow}>
          {terms.map((term) => {
            const active = term.id === activeTermId;

            return (
              <Pressable
                key={term.id}
                onPress={() => setTermId(term.id)}
                style={[styles.termChip, active && styles.termChipActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.termChipText, active && styles.termChipTextActive]}>{term.name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {bulletin.loading && !data ? (
        <Loading />
      ) : !data ? (
        <ErrorState message={bulletin.error ?? undefined} onRetry={bulletin.reload} />
      ) : data.subjects.length === 0 ? (
        <Empty icon="document-text-outline" title="Aucune note" sub="Aucun relevé pour cette période. Les notes seront publiées après les évaluations." />
      ) : (
        <>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>MOYENNE GÉNÉRALE</Text>
            <View style={styles.summaryMain}>
              <Text style={styles.summaryValue}>
                {data.general_average != null ? data.general_average.toFixed(2) : '—'}
                <Text style={styles.summaryOutOf}> / 20</Text>
              </Text>
              {data.mention ? <Pill label={data.mention} tone={data.general_average != null && data.general_average >= 10 ? 'ok' : 'danger'} /> : null}
            </View>
            <View style={styles.summaryFacts}>
              <Fact label="Rang" value={data.rank ? `${data.rank} / ${data.class_size}` : '—'} />
              <Fact label="Coefficients" value={String(data.total_coefficients)} />
              <Fact label="Matières" value={String(data.subjects.length)} />
            </View>
          </Card>

          <SectionHeader title="Détail par matière" />
          {data.subjects.map((subject) => (
            <Card key={subject.subject_id} style={styles.subjectCard}>
              <View style={styles.subjectTop}>
                <View style={styles.subjectInfo}>
                  <Text style={styles.subjectName} numberOfLines={1}>{subject.subject ?? 'Matière'}</Text>
                  <Text style={styles.subjectMeta}>Coefficient {subject.coefficient}</Text>
                </View>
                <Text style={[
                  styles.subjectAverage,
                  { color: subject.average >= 10 ? theme.ok : theme.danger },
                ]}>
                  {subject.average.toFixed(2)}
                </Text>
              </View>
              <View style={styles.gradesRow}>
                {subject.grades.map((grade, index) => (
                  <View key={`${grade.evaluation}-${index}`} style={styles.gradeChip}>
                    <Text style={styles.gradeLabel}>{evaluationLabel(grade.evaluation)}</Text>
                    <Text style={styles.gradeValue}>{grade.score} / {grade.max_score}</Text>
                  </View>
                ))}
              </View>
            </Card>
          ))}
        </>
      )}

      <View style={styles.footerSpace} />
    </ScrollView>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factValue}>{value}</Text>
      <Text style={styles.factLabel}>{label.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  fill: { flex: 1, backgroundColor: theme.bg },
  content: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 112 },
  childName: { color: theme.ink, fontSize: 19, fontWeight: '800', marginTop: 6 },
  childMeta: { color: theme.faint, fontSize: 11.5, marginTop: 2, marginBottom: 6 },
  termRow: { gap: 8, paddingVertical: 8 },
  termChip: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999,
    backgroundColor: theme.surfaceAlt, borderWidth: 1, borderColor: theme.line,
  },
  termChipActive: { backgroundColor: theme.accentSoft, borderColor: theme.accentStrong },
  termChipText: { color: theme.faint, fontSize: 12, fontWeight: '600' },
  termChipTextActive: { color: '#dfe6ff' },
  summaryCard: { marginTop: 6, gap: 8 },
  summaryLabel: { color: theme.faint, fontSize: 9, letterSpacing: 1.4, fontWeight: '700' },
  summaryMain: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  summaryValue: { color: theme.ink, fontSize: 40, fontWeight: '800', fontVariant: ['tabular-nums'] },
  summaryOutOf: { fontSize: 16, color: theme.faint, fontWeight: '600' },
  summaryFacts: { flexDirection: 'row', gap: 18, borderTopWidth: 1, borderTopColor: theme.line, paddingTop: 12 },
  fact: { gap: 2 },
  factValue: { color: theme.ink, fontSize: 14, fontWeight: '800' },
  factLabel: { color: theme.faint, fontSize: 8.5, letterSpacing: 1, fontWeight: '700' },
  subjectCard: { marginBottom: 10, gap: 10 },
  subjectTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  subjectInfo: { flex: 1 },
  subjectName: { color: theme.ink, fontSize: 13.5, fontWeight: '700' },
  subjectMeta: { color: theme.faint, fontSize: 10, marginTop: 2 },
  subjectAverage: { fontSize: 22, fontWeight: '800', fontVariant: ['tabular-nums'] },
  gradesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gradeChip: {
    backgroundColor: theme.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: theme.radiusSm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 1,
  },
  gradeLabel: { color: theme.faint, fontSize: 8, letterSpacing: 0.6, fontWeight: '700' },
  gradeValue: { color: theme.ink, fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
  footerSpace: { height: 24 },
});
