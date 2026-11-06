/**
 * Emploi du temps premium : semaine en pastilles jour, frise horaire
 * et cartes de cours à liseré coloré (GET /timetable).
 */
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';
import { theme } from '../theme';
import {
  Aurora,
  Chip,
  ChipRow,
  Empty,
  ErrorState,
  Loading,
  ScreenHeader,
  SectionHeader,
} from '../ui';
import { formatHour, fullName, isoWeek } from '../format';
import { useApiQuery } from '../useApiQuery';
import type { TimetableResponse, TimetableSlot } from '../types';

const DAY_LABELS = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];
const DAY_FULL = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const ACCENTS = [theme.accent, theme.ok, theme.copper, '#8F7BFF'];

function mondayOfCurrentWeek(): Date {
  const now = new Date();
  const day = now.getDay(); // 0 = dimanche
  const offset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + offset);
  monday.setHours(0, 0, 0, 0);

  return monday;
}

export default function TimetableScreen() {
  const { data, error, loading, reload } = useApiQuery<TimetableResponse>(
    () => api.get<TimetableResponse>('/timetable'),
    [],
  );

  const week = useMemo(() => {
    const monday = mondayOfCurrentWeek();

    return DAY_LABELS.map((label, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);

      return { label, day: index + 1, date };
    });
  }, []);

  const todayDay = new Date().getDay();
  const [selectedDay, setSelectedDay] = useState<number>(
    todayDay >= 1 && todayDay <= 6 ? todayDay : 1,
  );

  const slots = useMemo(() => {
    const all = data?.slots ?? [];

    return all
      .filter((slot) => slot.day_of_week === selectedDay)
      .slice()
      .sort((a, b) => String(a.starts_at).localeCompare(String(b.starts_at)));
  }, [data, selectedDay]);

  if (loading && !data) return <Loading />;
  if (!data) {
    return (
      <View style={styles.fill}>
        <ErrorState message={error ?? undefined} onRetry={reload} />
      </View>
    );
  }

  const selected = week.find((entry) => entry.day === selectedDay);

  return (
    <View style={styles.screen}>
      <Aurora />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Emploi du temps"
          sub={`Semaine ${isoWeek(new Date())}`}
          right={<Ionicons name="calendar-outline" size={22} color={theme.copper} />}
        />

        <ChipRow style={styles.days}>
          {week.map((entry) => {
            const isActive = entry.day === selectedDay;
            return (
              <View key={entry.day} style={styles.daySlot}>
                <Chip
                  label={`${entry.label} ${entry.date.getDate()}`}
                  active={isActive}
                  onPress={() => setSelectedDay(entry.day)}
                  small
                />
              </View>
            );
          })}
        </ChipRow>

        <SectionHeader
          title={selected ? `${DAY_FULL[selected.day - 1]} ${selected.date.getDate()}` : 'Cours'}
          right={<Text style={styles.count}>{slots.length} créneau{slots.length > 1 ? 'x' : ''}</Text>}
        />

        {slots.length === 0 ? (
          <Empty
            title="Aucun cours"
            sub={`Aucun créneau planifié pour ${selected ? DAY_FULL[selected.day - 1].toLowerCase() : 'ce jour'}.`}
          />
        ) : (
          <View style={styles.timeline}>
            {slots.map((slot: TimetableSlot, index) => (
              <View key={slot.id} style={styles.slotRow}>
                <View style={styles.timeColumn}>
                  <Text style={styles.startTime}>{formatHour(slot.starts_at)}</Text>
                  <Text style={styles.endTime}>{formatHour(slot.ends_at)}</Text>
                </View>
                <View style={[styles.accentBar, { backgroundColor: ACCENTS[index % ACCENTS.length] }]} />
                <View style={styles.slotCard}>
                  <View style={styles.slotHead}>
                    <Text style={styles.slotSubject} numberOfLines={1}>
                      {slot.subject?.name ?? 'Cours'}
                    </Text>
                    <Ionicons name="chevron-down" size={14} color={theme.ghost} />
                  </View>
                  <Text style={styles.slotMeta} numberOfLines={1}>
                    {slot.schoolClass?.name ?? '—'}
                    {slot.room || slot.schoolClass?.room ? ` · Salle ${slot.room ?? slot.schoolClass?.room}` : ''}
                  </Text>
                  {slot.staff ? (
                    <Text style={styles.slotStaff} numberOfLines={1}>{fullName(slot.staff)}</Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.footerSpace} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  fill: { flex: 1, backgroundColor: theme.bg },
  content: { paddingHorizontal: 16, paddingBottom: 44 },
  days: { marginTop: 12, marginHorizontal: -16 },
  daySlot: { alignItems: 'center' },
  count: { color: theme.faint, fontSize: 11, fontWeight: '600' },
  timeline: { gap: 12 },
  slotRow: { flexDirection: 'row', alignItems: 'stretch', gap: 10 },
  timeColumn: { width: 46, paddingTop: 13 },
  startTime: {
    color: theme.accent,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
    fontSize: 12.5,
  },
  endTime: {
    color: theme.ghost,
    fontVariant: ['tabular-nums'],
    fontSize: 10,
    marginTop: 2,
  },
  accentBar: { width: 3.5, borderRadius: 2 },
  slotCard: {
    flex: 1,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: theme.radius,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  slotHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  slotSubject: { color: theme.ink, fontSize: 14.5, fontWeight: '700', flex: 1 },
  slotMeta: { color: theme.faint, fontSize: 11, marginTop: 3 },
  slotStaff: { color: theme.ghost, fontSize: 10, marginTop: 3 },
  footerSpace: { height: 24 },
});
