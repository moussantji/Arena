/** Appel par classe et par date : marquage absent / présent, création/suppression côté API. */
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Keyboard,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
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
import { fullName, todayIso } from '../format';
import { useApiQuery } from '../useApiQuery';
import type { SchoolClassSummary, StudentRow } from '../types';

interface AbsencesIndex {
  data: { id: number; student_id: number; date: string; deleted?: boolean }[];
}

export default function CallScreen() {
  const classesQuery = useApiQuery<{ classes: SchoolClassSummary[] }>(
    () => api.get<{ classes: SchoolClassSummary[] }>('/classes'),
    [],
  );

  const classes = useMemo(() => classesQuery.data?.classes ?? [], [classesQuery.data]);
  const [classId, setClassId] = useState<number | null>(null);
  const [date, setDate] = useState(todayIso());
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (classId == null && classes.length) setClassId(classes[0].id);
  }, [classes, classId]);

  const dateValid = /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(new Date(date).getTime());

  const studentsQuery = useApiQuery<{ data: StudentRow[] } | null>(
    () => (classId == null
      ? Promise.resolve(null)
      : api.get(`/students?class_id=${classId}&per_page=200&active=1`)),
    [classId],
  );
  const students = useMemo(() => studentsQuery.data?.data ?? [], [studentsQuery.data]);

  const absencesQuery = useApiQuery<AbsencesIndex | null>(
    () => (classId == null || !dateValid
      ? Promise.resolve(null)
      : api.get<AbsencesIndex>(`/absences?class_id=${classId}&from=${date}&to=${date}&per_page=300`)),
    [classId, date],
  );
  const existingAbsences = useMemo(
    () => absencesQuery.data?.data ?? [],
    [absencesQuery.data],
  );
  const existingByStudent = useMemo(
    () => new Map(existingAbsences.map((absence) => [absence.student_id, absence.id])),
    [existingAbsences],
  );

  const [absent, setAbsent] = useState<Record<number, boolean>>({});

  // Pré-remplir avec l'appel déjà enregistré ce jour-là.
  useEffect(() => {
    if (!absencesQuery.data) return;
    const next: Record<number, boolean> = {};
    for (const absence of absencesQuery.data.data ?? []) {
      next[absence.student_id] = true;
    }
    setAbsent(next);
  }, [absencesQuery.data]);

  const absentCount = Object.values(absent).filter(Boolean).length;

  const saveCall = async () => {
    Keyboard.dismiss();
    if (classId == null || !dateValid) {
      Alert.alert('Appel incomplet', 'Choisissez une classe et une date au format AAAA-MM-JJ.');

      return;
    }

    setSaving(true);
    let created = 0;
    let removed = 0;
    const failures: string[] = [];

    for (const student of students) {
      const isAbsent = absent[student.id] === true;
      const absenceId = existingByStudent.get(student.id);

      try {
        if (isAbsent && absenceId == null) {
          await api.post('/absences', {
            student_id: student.id,
            school_class_id: classId,
            date,
            reason: reason.trim() || null,
            is_justified: false,
          });
          created += 1;
        } else if (!isAbsent && absenceId != null) {
          await api.delete(`/absences/${absenceId}`);
          removed += 1;
        }
      } catch (exception) {
        const message = exception instanceof ApiError ? exception.displayMessage : 'erreur inconnue';
        failures.push(`${fullName(student)} : ${message}`);
      }
    }

    setSaving(false);

    if (failures.length === 0) {
      Alert.alert('Appel enregistré', `${created} absence(s) créée(s), ${removed} rétablie(s).`);
      absencesQuery.reload();
    } else {
      Alert.alert(
        'Appel partiellement enregistré',
        `${failures.slice(0, 4).join('\n')}`,
      );
      absencesQuery.reload();
    }
  };

  if (classesQuery.loading) return <Loading />;
  if (classesQuery.error) {
    return (
      <View style={styles.fill}>
        <ErrorState message={classesQuery.error} onRetry={classesQuery.reload} />
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
            absencesQuery.reload();
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
            label={entry.name}
            active={entry.id === classId}
            onPress={() => setClassId(entry.id)}
          />
        ))}
        {classes.length === 0 && <Text style={styles.emptyInline}>Aucune classe.</Text>}
      </ChipRow>

      <SectionHeader title="Date de l'appel" />
      <TextInput
        style={[styles.dateInput, !dateValid && styles.dateInputInvalid]}
        value={date}
        onChangeText={setDate}
        placeholder="AAAA-MM-JJ"
        placeholderTextColor={theme.faint}
        keyboardType="numbers-and-punctuation"
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel="Date de l'appel"
      />
      <View style={styles.quickDates}>
        {[0, 1, 2].map((offset) => {
          const day = new Date();
          day.setDate(day.getDate() - offset);
          const iso = todayIsoFrom(day);
          const label = offset === 0 ? "Aujourd'hui" : offset === 1 ? 'Hier' : 'Avant-hier';

          return (
            <Pressable
              key={iso}
              onPress={() => setDate(iso)}
              style={[styles.quickDateChip, date === iso && styles.quickDateChipActive]}
            >
              <Text style={[styles.quickDateText, date === iso && styles.quickDateTextActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      <SectionHeader title="Motif (facultatif)" />
      <TextInput
        style={styles.reasonInput}
        value={reason}
        onChangeText={setReason}
        placeholder="Ex. : maladie, rendez-vous médical…"
        placeholderTextColor={theme.faint}
        maxLength={120}
        accessibilityLabel="Motif des absences"
      />

      {classId == null ? (
        <Empty title="Choisissez une classe" sub="L'appel se fait classe par classe, un jour précis." />
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
            right={<Text style={styles.absentBadge}>{absentCount} absent{absentCount > 1 ? 's' : ''}</Text>}
          />
          <View style={styles.listCard}>
            {students.map((student, index) => {
              const isAbsent = absent[student.id] === true;
              const alreadySaved = existingByStudent.has(student.id);

              return (
                <View key={student.id} style={[styles.row, index > 0 && styles.rowBorder]}>
                  <Avatar name={fullName(student)} size={36} />
                  <View style={styles.rowInfo}>
                    <Text style={styles.rowName} numberOfLines={1}>{fullName(student)}</Text>
                    <Text style={styles.rowMeta} numberOfLines={1}>
                      {student.matricule ?? '—'}{alreadySaved ? ' · absence enregistrée' : ''}
                    </Text>
                  </View>
                  <View style={styles.switchBlock}>
                    <Text style={[styles.switchLabel, isAbsent && styles.switchLabelAbsent]}>
                      {isAbsent ? 'Absent' : 'Présent'}
                    </Text>
                    <Switch
                      value={isAbsent}
                      onValueChange={(value) => setAbsent((prev) => ({ ...prev, [student.id]: value }))}
                      trackColor={{ false: '#232c58', true: 'rgba(240, 138, 138, 0.5)' }}
                      thumbColor={isAbsent ? '#f08a8a' : '#8b93c9'}
                      accessibilityLabel={`Absence de ${fullName(student)}`}
                    />
                  </View>
                </View>
              );
            })}
          </View>

          <Button
            label={saving ? 'Enregistrement…' : "Enregistrer l'appel"}
            onPress={() => void saveCall()}
            loading={saving}
            style={styles.saveButton}
          />
          <Text style={styles.saveHint}>
            Basculer un élève sur « Absent » crée l’absence ; la remettre sur « Présent » la supprime.
          </Text>
        </>
      )}
    </ScrollView>
  );
}

function todayIsoFrom(day: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');

  return `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`;
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  fill: { flex: 1, backgroundColor: theme.bg },
  content: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 48 },
  chipRow: { gap: 8, paddingVertical: 4, paddingRight: 16 },
  chip: {
    paddingHorizontal: 13, paddingVertical: 9, borderRadius: 999,
    backgroundColor: theme.surfaceAlt, borderWidth: 1, borderColor: theme.line, maxWidth: 200,
  },
  chipActive: { backgroundColor: theme.accentSoft, borderColor: theme.accentStrong },
  chipText: { color: theme.faint, fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#dfe6ff' },
  emptyInline: { color: theme.faint, padding: 8, alignSelf: 'center' },
  dateInput: {
    backgroundColor: theme.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: theme.radiusSm,
    color: theme.ink,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
    fontVariant: ['tabular-nums'],
    letterSpacing: 1,
  },
  dateInputInvalid: { borderColor: 'rgba(240, 138, 138, 0.5)' },
  quickDates: { flexDirection: 'row', gap: 8, marginTop: 8 },
  quickDateChip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
    borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surfaceSoft,
  },
  quickDateChipActive: { borderColor: theme.accentStrong, backgroundColor: theme.accentSoft },
  quickDateText: { color: theme.faint, fontSize: 11.5, fontWeight: '600' },
  quickDateTextActive: { color: '#dfe6ff' },
  reasonInput: {
    backgroundColor: theme.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: theme.radiusSm,
    color: theme.ink,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 13,
  },
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
  switchBlock: { alignItems: 'center', gap: 2 },
  switchLabel: { color: theme.faint, fontSize: 9, letterSpacing: 0.6, fontWeight: '700', textTransform: 'uppercase' },
  switchLabelAbsent: { color: theme.danger },
  absentBadge: { color: theme.copper, fontSize: 11, fontWeight: '700' },
  saveButton: { marginTop: 14 },
  saveHint: { color: theme.faint, fontSize: 10.5, textAlign: 'center', marginTop: 8, lineHeight: 15 },
});
