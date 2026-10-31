import React, { useEffect, useMemo, useState } from 'react';
import {
  Btn, Card, Pill, Tabs,
} from '../ui.jsx';
import {
  useApi, useData, DAYS, time, fullName,
} from '../data.jsx';
import { useActions } from '../actions.jsx';
import {
  ActionMenu, exportCsv, ListState, SelectFilter,
} from '../forms.jsx';
import { PageHead } from './common.jsx';

const slotTone = (subjectId) => ['a', 'b', 'c'][Number(subjectId || 0) % 3];
const duration = (slot) => {
  const [sh, sm] = String(slot.starts_at || '0:0').split(':').map(Number);
  const [eh, em] = String(slot.ends_at || '0:0').split(':').map(Number);
  return Math.max(0, (eh * 60 + em - sh * 60 - sm)) / 60;
};

export function EmploiDuTemps() {
  const { meta } = useData();
  const actions = useActions();
  const classes = meta?.classes || [];
  const storedClass = Number(window.localStorage.getItem('arena.class'));
  const [classId, setClassId] = useState(() => (
    classes.some((item) => item.id === storedClass) ? storedClass : (classes[0]?.id || '')
  ));

  useEffect(() => {
    if (!classId && classes.length) setClassId(classes[0].id);
  }, [classes.length]);

  const { data, loading, error, reload } = useApi('/timetable', { class_id: classId || undefined });
  const slots = data?.slots || [];
  const currentClass = classes.find((item) => item.id === Number(classId));
  const todayIndex = new Date().getDay() === 0 ? 7 : new Date().getDay();

  const activeDays = useMemo(() => {
    const days = Array.from(new Set(slots.map((slot) => Number(slot.day_of_week)))).filter(Boolean).sort();
    return days.length ? Array.from({ length: Math.max(5, Math.max(...days)) }, (_, index) => index + 1) : [1, 2, 3, 4, 5];
  }, [slots]);

  const hours = useMemo(() => {
    const values = Array.from(new Set(slots.map((slot) => String(slot.starts_at).slice(0, 5)))).sort();
    return values.length ? values : ['08:00', '10:00', '12:00', '14:00', '16:00'];
  }, [slots]);

  const totalHours = slots.reduce((sum, slot) => sum + duration(slot), 0);
  const teacherCount = new Set(slots.map((slot) => slot.staff_id).filter(Boolean)).size;

  const slotAt = (day, hour) => slots.find(
    (slot) => Number(slot.day_of_week) === day && String(slot.starts_at || '').slice(0, 5) === hour,
  );

  const exportRows = () => exportCsv(`diallo-emploi-du-temps-${currentClass?.name || 'classe'}`, [
    { label: 'Jour', value: (row) => DAYS[(row.day_of_week || 1) - 1] },
    { label: 'Début', value: (row) => time(row.starts_at) },
    { label: 'Fin', value: (row) => time(row.ends_at) },
    { label: 'Matière', value: (row) => row.subject?.name || '' },
    { label: 'Enseignant', value: (row) => (row.staff ? fullName(row.staff) : '') },
    { label: 'Salle', value: (row) => row.room || row.school_class?.room || '' },
    { label: 'Classe', value: (row) => row.school_class?.name || '' },
  ], slots);

  const addSlot = (day, hour) => actions.slot(null, {
    school_class_id: classId,
    day_of_week: day,
    starts_at: hour,
    ends_at: hour ? `${String(Math.min(23, Number(hour.slice(0, 2)) + 2)).padStart(2, '0')}:${hour.slice(3, 5)}` : '',
    term_id: meta?.term?.id,
  });

  return (
    <>
      <PageHead
        id="emploi-du-temps"
        sub={`${currentClass?.name || 'Classe'} · ${slots.length} cours · ${totalHours} h / semaine · ${teacherCount} enseignants`}
        onPrimary={() => actions.slot(null, { school_class_id: classId, day_of_week: todayIndex > 5 ? 1 : todayIndex, term_id: meta?.term?.id })}
        onSecondary={exportRows}
      />

      <div className="toolbar rise">
        {classes.length > 0 && (
          <Tabs
            items={classes.map((item) => item.name)}
            active={Math.max(0, classes.findIndex((item) => item.id === Number(classId)))}
            onChange={(index) => {
              const next = classes[index]?.id;
              setClassId(next);
              window.localStorage.setItem('arena.class', String(next));
            }}
          />
        )}
        <div className="toolbar-right">
          <Pill tone="accent" dot>{meta?.term?.name || 'Semestre 1'}</Pill>
          <Btn icon="calendar" onClick={() => setClassId(classes[0]?.id || '')}>Aujourd’hui</Btn>
        </div>
      </div>

      <Card className="rise timetable-card" pad={false} style={{ animationDelay: '80ms' }}>
        <ListState
          loading={loading && !data}
          error={error}
          empty={!loading && !error && !slots.length}
          emptyTitle="Aucun cours cette semaine"
          emptySub="Cliquez sur une case du planning pour ajouter un créneau."
          onRetry={reload}
        >
          <div className="tt-grid" style={{ gridTemplateColumns: `74px repeat(${activeDays.length}, minmax(0, 1fr))` }}>
            <div className="tt-corner" />
            {activeDays.map((day) => (
              <div key={day} className={`tt-day ${day === todayIndex ? 'today' : ''}`}>
                {DAYS[day - 1].slice(0, 3)}
                {day === todayIndex && <i className="tt-today-dot" />}
              </div>
            ))}

            {hours.map((hour) => (
              <React.Fragment key={hour}>
                <div className="tt-hour mono">{hour}</div>
                {activeDays.map((day) => {
                  const slot = slotAt(day, hour);
                  return (
                    <div className="tt-cell" key={`${day}-${hour}`}>
                      {slot ? (
                        <div
                          role="button"
                          tabIndex={0}
                          className={`tt-slot slot-${slotTone(slot.subject_id)} ${slot.is_live ? 'live' : ''}`}
                          onClick={() => actions.slot(slot)}
                          onKeyDown={(event) => { if (event.key === 'Enter') actions.slot(slot); }}
                          title={`${slot.subject?.name || 'Cours'} · ${fullName(slot.staff)}`}
                        >
                          <b>{slot.subject?.name || 'Cours'}</b>
                          <span className="mono">{slot.room || slot.school_class?.room || '—'} · {time(slot.starts_at)}</span>
                          <span className="tt-teacher">{slot.staff ? fullName(slot.staff) : 'Enseignant à définir'}</span>
                          <span className="tt-actions">
                            <ActionMenu actions={[
                              { label: 'Modifier le cours', icon: 'edit', onClick: () => actions.slot(slot) },
                              { label: 'Supprimer le cours', icon: 'trash', tone: 'danger', onClick: () => actions.deleteSlot(slot) },
                            ]} />
                          </span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="tt-empty-add"
                          onClick={() => addSlot(day, hour)}
                          aria-label={`Ajouter un cours ${DAYS[day - 1]} à ${hour}`}
                        >
                          <span>+</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </ListState>
      </Card>

      <div className="legend rise">
        <span><i className="lg-a" />Sciences</span>
        <span><i className="lg-b" />Lettres</span>
        <span><i className="lg-c" />Autres</span>
        <span className="legend-now"><i />Cours en cours</span>
        <span className="legend-hint">Cliquez sur une case vide pour ajouter un cours.</span>
      </div>
    </>
  );
}
