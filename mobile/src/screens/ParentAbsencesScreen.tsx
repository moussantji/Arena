/** Absences de l'enfant lié, avec justification détaillée. */
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useChildren, ChildSelector } from '../children';
import { api } from '../api';
import { theme } from '../theme';
import { Card, Empty, ErrorState, Loading, SectionHeader, Pill, StatCard } from '../ui';
import { formatDate, fullName, formatHour } from '../format';
import type { ParentAbsencesResponse } from '../types';
import { useApiQuery } from '../useApiQuery';

export default function ParentAbsencesScreen() {
  const { selectedChild, loading: childrenLoading, error: childrenError, reload: reloadChildren } = useChildren();
  const absences = useApiQuery<ParentAbsencesResponse | null>(
    () => (selectedChild
      ? api.get<ParentAbsencesResponse>(`/parent/children/${selectedChild.id}/absences`)
      : Promise.resolve(null)),
    [selectedChild?.id],
  );

  if (childrenLoading && !selectedChild) return <Loading />;
  if (!selectedChild) {
    return (
      <View style={styles.fill}>
        <ErrorState message={childrenError ?? 'Aucun enfant lié à votre compte.'} onRetry={reloadChildren} />
      </View>
    );
  }

  const data = absences.data;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ChildSelector />
      <Text style={styles.childName}>{fullName(selectedChild)}</Text>
      <Text style={styles.childMeta}>Historique des absences</Text>

      {absences.loading && !data ? (
        <Loading />
      ) : !data ? (
        <ErrorState message={absences.error ?? undefined} onRetry={absences.reload} />
      ) : (
        <>
          <View style={styles.summaryRow}>
            <StatCard label="Total" value={String(data.summary.total)} tone="muted" />
            <StatCard label="Justifiées" value={String(data.summary.justified)} tone="ok" />
            <StatCard label="Non justifiées" value={String(data.summary.unjustified)} tone={data.summary.unjustified ? 'copper' : 'ok'} />
          </View>

          {data.absences.length === 0 ? (
            <Empty icon="shield-checkmark-outline" title="Aucune absence" sub="Félicitations : aucune absence enregistrée pour cet enfant." />
          ) : (
            <>
              <SectionHeader title="Historique" />
              {data.absences.map((absence) => (
                <Card key={absence.id} style={styles.absenceCard}>
                  <View style={styles.absenceTop}>
                    <View style={styles.absenceDateBox}>
                      <Text style={styles.absenceDay}>
                        {new Date(absence.date).getDate()}
                      </Text>
                      <Text style={styles.absenceMonth}>
                        {new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(new Date(absence.date))}
                      </Text>
                    </View>
                    <View style={styles.absenceBody}>
                      <View style={styles.absenceHeaderRow}>
                        <Text style={styles.absenceReason} numberOfLines={1}>
                          {absence.reason?.trim() ? absence.reason : 'Absence'}
                        </Text>
                        <Pill
                          label={absence.is_justified ? 'Justifiée' : 'Non justifiée'}
                          tone={absence.is_justified ? 'ok' : 'copper'}
                        />
                      </View>
                      <Text style={styles.absenceMeta}>
                        {formatDate(absence.date)}
                        {absence.starts_at ? ` · ${formatHour(absence.starts_at)}${absence.ends_at ? `–${formatHour(absence.ends_at)}` : ''}` : ''}
                        {absence.class ? ` · ${absence.class}` : ''}
                      </Text>
                      {absence.is_justified && absence.justification ? (
                        <Text style={styles.justification}>{absence.justification}</Text>
                      ) : null}
                    </View>
                  </View>
                </Card>
              ))}
            </>
          )}
        </>
      )}

      <View style={styles.footerSpace} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  fill: { flex: 1, backgroundColor: theme.bg },
  content: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 112 },
  childName: { color: theme.ink, fontSize: 19, fontWeight: '800', marginTop: 6 },
  childMeta: { color: theme.faint, fontSize: 11.5, marginTop: 2, marginBottom: 8 },
  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  absenceCard: { marginBottom: 10 },
  absenceTop: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  absenceDateBox: {
    width: 46,
    alignItems: 'center',
    backgroundColor: theme.surfaceAlt,
    borderRadius: theme.radiusSm,
    paddingVertical: 8,
    gap: 0,
  },
  absenceDay: { color: theme.ink, fontSize: 18, fontWeight: '800' },
  absenceMonth: { color: theme.faint, fontSize: 9, textTransform: 'uppercase', fontWeight: '700' },
  absenceBody: { flex: 1, gap: 3 },
  absenceHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  absenceReason: { color: theme.ink, fontSize: 13, fontWeight: '700', flexShrink: 1 },
  absenceMeta: { color: theme.faint, fontSize: 10.5 },
  justification: {
    color: '#b9c8ff',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 4,
    backgroundColor: theme.surfaceSoft,
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: theme.line,
  },
  footerSpace: { height: 24 },
});
