/**
 * Saisie des notes premium par l'enseignant : classe → matière → période →
 * évaluation. Chaque note est enregistrée via le point d'entrée d'upsert de
 * l'API (une note existe au plus par élève / matière / période / évaluation).
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api, ApiError } from '../api';
import { theme } from '../theme';
import {
  Aurora,
  Avatar,
  Button,
  Chip,
  ChipRow,
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

  const classAverage = useMemo(() => {
    const values = Object.values(scores)
      .map((raw) => Number(String(raw).trim().replace(',', '.')))
      .filter((value) => Number.isFinite(value) && value >= 0 && value <= 20);
    if (values.length === 0) return null;

    return values.reduce((total, value) => total + value, 0) / values.length;
  }, [scores]);

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

  const selectedClass = classes.find((entry) => entry.id === classId);
  const selectedSubject = subjects.find((entry) => entry.id === subjectId);
  const selectedTerm = terms.find((entry) => entry.id === termId);

  return (
    <View style={styles.screen}>
      <Aurora />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Notes</Text>
            <Text style={styles.subtitle}>
              {selectedClass?.name ?? 'Classe'} · {selectedSubject?.name ?? 'Matière'}
            </Text>
          </View>
          <View style={styles.termBadge}>
            <Ionicons name="lock-closed-outline" size={11} color={theme.copper} />
            <Text style={styles.termBadgeText}>{selectedTerm?.name ?? '—'}</Text>
          </View>
        </View>

        <SectionHeader title="Classe & matière" />
        <ChipRow>
          {classes.map((entry) => (
            <Chip
              key={entry.id}
              label={entry.name}
              active={entry.id === classId}
              onPress={() => setClassId(entry.id)}
              small
            />
          ))}
          {classes.length === 0 && <EmptyInline label="Aucune classe (année courante)." />}
        </ChipRow>
        <ChipRow style={styles.chipRowSpaced}>
          {subjects.map((entry) => (
            <Chip
              key={entry.id}
              label={entry.name}
              active={entry.id === subjectId}
              onPress={() => setSubjectId(entry.id)}
              small
            />
          ))}
          {subjects.length === 0 && <EmptyInline label="Aucune matière active." />}
        </ChipRow>

        <SectionHeader title="Évaluation" />
        <View style={styles.evalCard}>
          <View style={styles.evalIcon}>
            <Ionicons name="document-text-outline" size={17} color={theme.copper} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.evalTitle}>{evaluationLabel(evaluation)} · 20 pts</Text>
            <Text style={styles.evalMeta}>
              {selectedTerm?.name ?? '—'} · {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
            </Text>
          </View>
        </View>
        <ChipRow style={styles.chipRowSpaced}>
          {EVALUATIONS.map((key) => (
            <Chip
              key={key}
              label={evaluationLabel(key)}
              active={key === evaluation}
              onPress={() => setEvaluation(key)}
              small
            />
          ))}
        </ChipRow>

        {termLocked ? (
          <View style={styles.lockedBanner}>
            <Ionicons name="lock-closed" size={13} color={theme.danger} />
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
                    <Avatar name={fullName(student)} size={38} />
                    <View style={styles.rowInfo}>
                      <Text style={styles.rowName} numberOfLines={1}>{fullName(student)}</Text>
                      <Text style={styles.rowMeta} numberOfLines={1}>
                        {student.matricule ?? '—'}{existing != null ? ` · enregistrée : ${existing}` : ''}
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
                      placeholderTextColor={theme.ghost}
                      editable={!termLocked && !saving}
                      selectTextOnFocus
                      accessibilityLabel={`Note de ${fullName(student)}`}
                    />
                  </View>
                );
              })}
            </View>
          </>
        )}

        <View style={styles.bottomSpace} />
      </ScrollView>

      <View style={styles.saveBar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.saveBarLabel}>MOYENNE CLASSE</Text>
          <Text style={styles.saveBarValue}>
            {classAverage != null ? classAverage.toFixed(1) : '—'}
            <Text style={styles.saveBarMax}> / 20</Text>
          </Text>
        </View>
        <Button
          label={saving ? 'Enregistrement…' : 'Enregistrer'}
          variant="gold"
          onPress={() => void saveAll()}
          loading={saving}
          disabled={termLocked || dirtyIds.length === 0}
          style={styles.saveButton}
        />
      </View>
    </View>
  );
}

function EmptyInline({ label }: { label: string }) {
  return <Text style={styles.emptyInline}>{label}</Text>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  fill: { flex: 1, backgroundColor: theme.bg },
  flex: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 12 },
  title: { color: theme.ink, fontSize: 27, fontWeight: '800', letterSpacing: -0.4 },
  subtitle: { color: theme.faint, fontSize: 13, marginTop: 3 },
  termBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: theme.copperSoft,
    borderColor: 'rgba(224, 168, 111, 0.35)',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  termBadgeText: { color: theme.copper, fontSize: 10.5, fontWeight: '700' },
  chipRowSpaced: { marginTop: 8 },
  emptyInline: { color: theme.faint, fontSize: 12, alignSelf: 'center', padding: 8 },
  evalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: theme.radius,
    padding: 14,
  },
  evalIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: theme.copperSoft,
    borderWidth: 1,
    borderColor: 'rgba(224, 168, 111, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  evalTitle: { color: theme.ink, fontSize: 14, fontWeight: '700' },
  evalMeta: { color: theme.faint, fontSize: 11, marginTop: 2 },
  lockedBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: theme.dangerSoft,
    borderColor: 'rgba(240, 138, 138, 0.4)',
    borderWidth: 1,
    borderRadius: theme.radiusSm,
    padding: 12,
    marginTop: 12,
  },
  lockedText: { color: theme.danger, fontSize: 12, lineHeight: 17, flex: 1 },
  dirtyBadge: { color: theme.copper, fontSize: 11, fontWeight: '700' },
  listCard: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: theme.radius,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 11 },
  rowBorder: { borderTopWidth: 1, borderTopColor: theme.line },
  rowInfo: { flex: 1 },
  rowName: { color: theme.ink, fontSize: 13.5, fontWeight: '700' },
  rowMeta: { color: theme.faint, fontSize: 9.5, marginTop: 2 },
  scoreInput: {
    width: 66,
    backgroundColor: 'rgba(7, 11, 31, 0.55)',
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: theme.radiusSm,
    color: theme.ink,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 9,
    fontVariant: ['tabular-nums'],
  },
  scoreInputDirty: {
    borderColor: 'rgba(143, 165, 255, 0.85)',
    backgroundColor: theme.accentSoft,
    shadowColor: theme.accent,
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  bottomSpace: { height: 110 },
  saveBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: 'rgba(11, 16, 48, 0.92)',
    borderTopWidth: 1,
    borderTopColor: theme.lineStrong,
  },
  saveBarLabel: { color: theme.copper, fontSize: 8.5, letterSpacing: 1.5, fontWeight: '700' },
  saveBarValue: { color: theme.ink, fontSize: 21, fontWeight: '800', fontVariant: ['tabular-nums'], marginTop: 2 },
  saveBarMax: { color: theme.ghost, fontSize: 11, fontWeight: '600' },
  saveButton: { minWidth: 168 },
});
