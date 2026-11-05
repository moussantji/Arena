/**
 * Saisie des notes par l'enseignant : classe → matière → période → évaluation.
 * Chaque note est enregistrée via le point d'entrée d'upsert de l'API
 * (une note existe au plus par élève / matière / période / évaluation).
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Keyboard,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { api, ApiError } from '../api';
import { theme } from '../theme';
import {
  Avatar,
  Button,
  Empty,
  ErrorState,
  Loading,
  SectionHeader,
} from '../ui';
import { evaluationLabel, fullName, todayIso } from '../format';
import { useApiQuery } from '../useApiQuery';
import type {
  SchoolClassSummary,
  StudentRow,
  Subject,
  Term,
} from '../types';

type Evaluation = 'devoir_1' | 'devoir_2' | 'composition';
const EVALUATIONS: Evaluation[] = ['devoir_1', 'devoir_2', 'composition'];

interface GradesIndex {
  data: {
    id: number;
    student_id: number;
    score: string | number;
    max_score: string | number;
  }[];
}

interface MetaResponse {
  terms?: Term[];
  academic_year?: { id: number; label: string } | null;
}

export default function NotesScreen() {
  const classesQuery = useApiQuery<{ classes: SchoolClassSummary[] }>(
    () => api.get<{ classes: SchoolClassSummary[] }>('/classes'),
    [],
  );
  const subjectsQuery = useApiQuery<{ subjects: Subject[] }>(
    () => api.get<{ subjects: Subject[] }>('/subjects'),
    [],
  );
  const metaQuery = useApiQuery<MetaResponse>(() => api.get<MetaResponse>('/meta'), []);

  const [classId, setClassId] = useState<number | null>(null);
  const [subjectId, setSubjectId] = useState<number | null>(null);
  const [termId, setTermId] = useState<number | null>(null);
  const [evaluation, setEvaluation] = useState<Evaluation>('devoir_1');
  const [scores, setScores] = useState<Record<number, string>>({});
  const [initialScores, setInitialScores] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState<number | null>(null);

  const terms = useMemo(() => metaQuery.data?.terms ?? [], [metaQuery.data]);
  const classes = useMemo(() => classesQuery.data?.classes ?? [], [classesQuery.data]);
  const subjects = useMemo(() => subjectsQuery.data?.subjects ?? [], [subjectsQuery.data]);

  // Sélections par défaut : première classe, premier trimestre courant, matière inchangée.
  useEffect(() => {
    if (classId == null && classes.length) setClassId(classes[0].id);
  }, [classes, classId]);
  useEffect(() => {
    if (termId == null && terms.length) {
      setTermId(terms.find((term) => term.is_current)?.id ?? terms[0].id);
    }
  }, [terms, termId]);

  const termLocked = useMemo(
    () => Boolean(terms.find((term) => term.id === termId)?.locked_at),
    [terms, termId],
  );

  const studentsQuery = useApiQuery<{ data: StudentRow[] } | null>(
    () => (classId == null
      ? Promise.resolve(null)
      : api.get<{ data: StudentRow[] }>(`/students?class_id=${classId}&per_page=200&active=1`)),
    [classId],
  );
  const students = useMemo(() => studentsQuery.data?.data ?? [], [studentsQuery.data]);

  const gradesQuery = useApiQuery<GradesIndex | null>(
    () => {
      if (classId == null || subjectId == null || termId == null) return Promise.resolve(null);

      return api.get<GradesIndex>(
        `/grades?class_id=${classId}&subject_id=${subjectId}&term_id=${termId}&evaluation=${evaluation}&per_page=300`,
      );
    },
    [classId, subjectId, termId, evaluation],
  );

  // Pré-remplir les notes déjà enregistrées.
  useEffect(() => {
    if (!gradesQuery.data) return;
    const next: Record<number, string> = {};
    for (const grade of gradesQuery.data.data ?? []) {
      next[grade.student_id] = String(grade.score);
    }
    setScores(next);
    setInitialScores(next);
    setSavedCount(null);
  }, [gradesQuery.data]);

  const dirtyIds = useMemo(
    () => Object.keys(scores)
      .map(Number)
      .filter((id) => scores[id]?.trim() !== '' && scores[id] !== initialScores[id]),
    [scores, initialScores],
  );

  const saveAll = async () => {
    Keyboard.dismiss();
    if (classId == null || subjectId == null || termId == null) {
      Alert.alert('Sélection incomplète', 'Choisissez une classe, une matière et une période.');

      return;
    }
    if (dirtyIds.length === 0) {
      Alert.alert('Rien à enregistrer', 'Aucune note modifiée.');

      return;
    }

    setSaving(true);
    let saved = 0;
    const failures: string[] = [];
    const evaluatedOn = todayIso();

    for (const id of dirtyIds) {
      const raw = scores[id]?.trim().replace(',', '.') ?? '';
      const value = Number(raw);
      if (raw === '' || Number.isNaN(value) || value < 0 || value > 20) {
        failures.push(`Élève #${id} : note invalide (« ${scores[id]} »)`);
        continue;
      }

      try {
        await api.post('/grades', {
          student_id: id,
          subject_id: subjectId,
          term_id: termId,
          evaluation,
          score: value,
          max_score: 20,
          evaluated_on: evaluatedOn,
        });
        saved += 1;
      } catch (exception) {
        const message = exception instanceof ApiError ? exception.displayMessage : 'erreur inconnue';
        const student = students.find((entry) => entry.id === id);
        failures.push(`${student ? fullName(student) : `Élève #${id}`} : ${message}`);
      }
    }

    setSaving(false);
    setSavedCount(saved);

    if (failures.length === 0) {
      Alert.alert('Notes enregistrées', `${saved} note${saved > 1 ? 's' : ''} enregistrée${saved > 1 ? 's' : ''}.`);
      gradesQuery.reload();
    } else {
      Alert.alert(
        'Enregistrement partiel',
        `${saved} enregistrée(s), ${failures.length} échec(s) :\n${failures.slice(0, 4).join('\n')}`,
      );
    }
  };

  if (classesQuery.loading || subjectsQuery.loading || metaQuery.loading) {
    return <Loading />;
  }
  const loadError = classesQuery.error ?? subjectsQuery.error ?? metaQuery.error;
  if (loadError) {
    return (
      <View style={styles.fill}>
        <ErrorState
          message={loadError}
          onRetry={() => {
            classesQuery.reload();
            subjectsQuery.reload();
            metaQuery.reload();
          }}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={(
        <RefreshControl
          refreshing={false}
          onRefresh={() => {
            studentsQuery.reload();
            gradesQuery.reload();
          }}
          tintColor={theme.accent}
        />
      )}
    >
      <SectionHeader title="Classe" />
      <ChipRow>
        {classes.map((entry) => (
          <Chip
            key={entry.id}
            label={`${entry.name}${entry.level ? ` · ${entry.level}` : ''}`}
            active={entry.id === classId}
            onPress={() => setClassId(entry.id)}
          />
        ))}
        {classes.length === 0 && <EmptyInline label="Aucune classe (année courante)." />}
      </ChipRow>

      <SectionHeader title="Matière" />
      <ChipRow>
        {subjects.map((entry) => (
          <Chip
            key={entry.id}
            label={entry.name}
            active={entry.id === subjectId}
            onPress={() => setSubjectId(entry.id)}
          />
        ))}
        {subjects.length === 0 && <EmptyInline label="Aucune matière active." />}
      </ChipRow>

      <SectionHeader title="Période" />
      <ChipRow>
        {terms.map((term) => (
          <Chip key={term.id} label={term.name} active={term.id === termId} onPress={() => setTermId(term.id)} />
        ))}
      </ChipRow>

      <SectionHeader title="Évaluation" />
      <ChipRow>
        {EVALUATIONS.map((key) => (
          <Chip key={key} label={evaluationLabel(key)} active={key === evaluation} onPress={() => setEvaluation(key)} />
        ))}
      </ChipRow>

      {termLocked ? (
        <View style={styles.lockedBanner}>
          <Text style={styles.lockedText}>
            Cette période est verrouillée par la direction : les notes ne peuvent plus être modifiées.
          </Text>
        </View>
      ) : null}

      {classId == null || subjectId == null || termId == null ? (
        <Empty
          title="Sélectionnez le contexte"
          sub="Choisissez la classe, la matière, la période et l'évaluation à saisir."
        />
      ) : studentsQuery.loading && !studentsQuery.data ? (
        <Loading />
      ) : studentsQuery.error ? (
        <ErrorState message={studentsQuery.error} onRetry={studentsQuery.reload} />
      ) : students.length === 0 ? (
        <Empty title="Aucun élève" sub="Cette classe ne compte aucun élève actif." />
      ) : (
        <>
          <SectionHeader
            title={`Élèves (${students.length})`}
            right={<Text style={styles.dirtyBadge}>{dirtyIds.length} modifiée{dirtyIds.length > 1 ? 's' : ''}</Text>}
          />
          <View style={styles.listCard}>
            {students.map((student, index) => {
              const existing = initialScores[student.id];
              const current = scores[student.id] ?? '';
              const dirty = current.trim() !== '' && current !== existing;

              return (
                <View
                  key={student.id}
                  style={[styles.row, index > 0 && styles.rowBorder]}
                >
                  <Avatar name={fullName(student)} size={36} />
                  <View style={styles.rowInfo}>
                    <Text style={styles.rowName} numberOfLines={1}>{fullName(student)}</Text>
                    <Text style={styles.rowMeta} numberOfLines={1}>
                      {student.matricule ?? '—'}{existing != null ? ` · note enregistrée : ${existing}` : ''}
                    </Text>
                  </View>
                  <TextInput
                    style={[styles.scoreInput, dirty && styles.scoreInputDirty]}
                    value={current}
                    onChangeText={(value) => {
                      setScores((prev) => ({ ...prev, [student.id]: value }));
                      setSavedCount(null);
                    }}
                    keyboardType="decimal-pad"
                    maxLength={5}
                    placeholder="—"
                    placeholderTextColor={theme.faint}
                    editable={!termLocked && !saving}
                    selectTextOnFocus
                    accessibilityLabel={`Note de ${fullName(student)}`}
                  />
                </View>
              );
            })}
          </View>

          <Button
            label={saving ? 'Enregistrement…' : `Enregistrer (${dirtyIds.length})`}
            onPress={() => void saveAll()}
            loading={saving}
            disabled={termLocked || dirtyIds.length === 0}
            style={styles.saveButton}
          />
          {savedCount != null && savedCount > 0 ? (
            <Text style={styles.savedNote}>{savedCount} note(s) enregistrée(s) ✓</Text>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

function ChipRow({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
      {children}
    </ScrollView>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

function EmptyInline({ label }: { label: string }) {
  return <Text style={styles.emptyInline}>{label}</Text>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  fill: { flex: 1, backgroundColor: theme.bg },
  content: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 48 },
  chipRow: { gap: 8, paddingVertical: 4, paddingRight: 16 },
  chip: {
    paddingHorizontal: 13, paddingVertical: 9, borderRadius: 999,
    backgroundColor: theme.surfaceAlt, borderWidth: 1, borderColor: theme.line,
    maxWidth: 210,
  },
  chipActive: { backgroundColor: theme.accentSoft, borderColor: theme.accentStrong },
  chipText: { color: theme.faint, fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#dfe6ff' },
  emptyInline: { color: theme.faint, fontSize: 12, alignSelf: 'center', padding: 8 },
  lockedBanner: {
    backgroundColor: 'rgba(240, 138, 138, 0.12)',
    borderColor: 'rgba(240, 138, 138, 0.4)',
    borderWidth: 1,
    borderRadius: theme.radiusSm,
    padding: 12,
    marginTop: 10,
  },
  lockedText: { color: theme.danger, fontSize: 12, lineHeight: 17 },
  listCard: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: theme.radius,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10 },
  rowBorder: { borderTopWidth: 1, borderTopColor: theme.line },
  rowInfo: { flex: 1 },
  rowName: { color: theme.ink, fontSize: 13, fontWeight: '700' },
  rowMeta: { color: theme.faint, fontSize: 9.5, marginTop: 2 },
  scoreInput: {
    width: 64,
    backgroundColor: theme.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: theme.radiusSm,
    color: theme.ink,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 8,
    fontVariant: ['tabular-nums'],
  },
  scoreInputDirty: { borderColor: theme.accentStrong, backgroundColor: theme.accentSoft },
  dirtyBadge: { color: theme.accent, fontSize: 11, fontWeight: '700' },
  saveButton: { marginTop: 14 },
  savedNote: { color: theme.ok, textAlign: 'center', marginTop: 8, fontSize: 12, fontWeight: '600' },
});
