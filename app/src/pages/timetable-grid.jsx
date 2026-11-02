import React, { useMemo } from 'react';
import { ActionMenu } from '../forms.jsx';
import { DAYS, fullName, time } from '../data.jsx';
import {
  dayIndex, sameWeek, startOfWeek, weekDayNumber,
} from '../week.js';

/* ============================================================
   DIALLO — grille hebdomadaire partagée
   Utilisée par la page Emploi du temps et la fiche classe.
   ============================================================ */

export const slotTone = (subjectId) => ['a', 'b', 'c'][Number(subjectId || 0) % 3];

export const minutesOf = (value) => {
  const [hours, minutes] = String(value || '0:0').split(':').map(Number);
  return (Number(hours) || 0) * 60 + (Number(minutes) || 0);
};

export const isSlotLive = (slot, now = new Date()) => {
  if (Number(slot?.day_of_week) !== dayIndex(now)) return false;
  const current = now.getHours() * 60 + now.getMinutes();
  return current >= minutesOf(slot.starts_at) && current < minutesOf(slot.ends_at);
};

export const gridDays = (slots) => {
  const days = Array.from(new Set(slots.map((slot) => Number(slot.day_of_week)))).filter(Boolean).sort();
  return days.length
    ? Array.from({ length: Math.max(5, Math.max(...days)) }, (_, index) => index + 1)
    : [1, 2, 3, 4, 5];
};

export const gridHours = (slots) => {
  const values = Array.from(new Set(slots.map((slot) => String(slot.starts_at || '').slice(0, 5)))).filter(Boolean).sort();
  return values.length ? values : ['08:00', '10:00', '12:00', '14:00', '16:00'];
};

export const slotDuration = (slot) => (
  Math.max(0, minutesOf(slot?.ends_at) - minutesOf(slot?.starts_at)) / 60
);

export function WeekGrid({
  slots = [],
  days,
  weekStart,
  today = dayIndex(),
  now = new Date(),
  onSlot,
  onAdd,
  onDelete,
  readOnly = false,
  compact = false,
}) {
  const activeDays = useMemo(() => (days && days.length ? days : gridDays(slots)), [days, slots]);
  const hours = useMemo(() => gridHours(slots), [slots]);
  const anchor = weekStart ? new Date(weekStart) : startOfWeek(now);
  const isCurrentWeek = sameWeek(anchor, now);
  const highlightDay = isCurrentWeek ? today : null;

  const slotsAt = (day, hour) => slots.filter(
    (slot) => Number(slot.day_of_week) === day && String(slot.starts_at || '').slice(0, 5) === hour,
  );

  return (
    <div
      className={`tt-grid${compact ? ' is-compact' : ''}`}
      style={{ gridTemplateColumns: `74px repeat(${activeDays.length}, minmax(0, 1fr))` }}
    >
      <div className="tt-corner" />
      {activeDays.map((day) => (
        <div key={day} className={`tt-day ${day === highlightDay ? 'today' : ''}`}>
          <span>{DAYS[day - 1]?.slice(0, 3)}</span>
          <i className="tt-day-date">{weekDayNumber(anchor, day)}</i>
          {day === highlightDay && <i className="tt-today-dot" />}
        </div>
      ))}

      {hours.map((hour) => (
        <React.Fragment key={hour}>
          <div className="tt-hour mono">{hour}</div>
          {activeDays.map((day) => {
            const daySlots = slotsAt(day, hour);
            const slot = daySlots[0];
            const live = Boolean(slot && isCurrentWeek && isSlotLive(slot, now));
            return (
              <div className={`tt-cell${day === highlightDay ? ' is-today' : ''}`} key={`${day}-${hour}`}>
                {slot ? (
                  <div
                    role={onSlot ? 'button' : undefined}
                    tabIndex={onSlot ? 0 : undefined}
                    className={`tt-slot slot-${slotTone(slot.subject_id)}${live ? ' live' : ''}`}
                    onClick={onSlot ? () => onSlot(slot) : undefined}
                    onKeyDown={onSlot ? (event) => {
                      if (event.target !== event.currentTarget) return;
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onSlot(slot);
                      }
                    } : undefined}
                    title={`${slot.subject?.name || 'Cours'} · ${slot.staff ? fullName(slot.staff) : 'Enseignant à définir'}`}
                  >
                    {live && <span className="tt-live-tag">En cours</span>}
                    <b>{slot.subject?.name || 'Cours'}</b>
                    <span className="mono">{slot.room || slot.school_class?.room || '—'} · {time(slot.starts_at)}–{time(slot.ends_at)}</span>
                    <span className="tt-teacher">{slot.staff ? fullName(slot.staff) : 'Enseignant à définir'}</span>
                    {!readOnly && (onSlot || onDelete) && (
                      <span className="tt-actions" onClick={(event) => event.stopPropagation()}>
                        <ActionMenu actions={[
                          ...(onSlot ? [{ label: 'Modifier le cours', icon: 'edit', onClick: () => onSlot(slot) }] : []),
                          ...(onDelete ? [{ label: 'Supprimer le cours', icon: 'trash', tone: 'danger', onClick: () => onDelete(slot) }] : []),
                        ]} />
                      </span>
                    )}
                    {daySlots.length > 1 && <span className="tt-more">+{daySlots.length - 1}</span>}
                  </div>
                ) : !readOnly && onAdd ? (
                  <button
                    type="button"
                    className="tt-empty-add"
                    onClick={() => onAdd(day, hour)}
                    aria-label={`Ajouter un cours ${DAYS[day - 1]} à ${hour}`}
                  >
                    <span>+</span>
                  </button>
                ) : (
                  <span className="tt-empty" />
                )}
              </div>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
}
