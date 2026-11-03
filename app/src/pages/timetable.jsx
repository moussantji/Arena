import React, { useEffect, useState } from 'react';
import {
  Btn, Card, IconBtn, Pill, Tabs,
} from '../ui.jsx';
import {
  useApi, useData, DAYS, time, fullName, number,
} from '../data.jsx';
import { useActions } from '../actions.jsx';
import { errorMessage } from '../api.js';
import { exportTimetableWorkbook } from '../exports.js';
import { ListState } from '../forms.jsx';
import { PageHead } from './common.jsx';
import { WeekGrid, isSlotLive, slotDuration } from './timetable-grid.jsx';
import {
  addDays, dayIndex, sameWeek, startOfWeek, weekRangeLabel,
} from '../week.js';

export function EmploiDuTemps() {
  const {
    meta, classId: storedClassId, setClassId, notify, can,
  } = useData();
  const actions = useActions();
  const canManage = can('schedules.manage');
  const classes = meta?.classes || [];
  const classId = classes.some((item) => Number(item.id) === Number(storedClassId))
    ? Number(storedClassId)
    : (classes[0]?.id || '');
  const [viewDay, setViewDay] = useState(null);
  const [now, setNow] = useState(() => new Date());
  const [weekOffset, setWeekOffset] = useState(() => (dayIndex(new Date()) >= 6 ? 1 : 0));
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (classes.length && !classes.some((item) => Number(item.id) === Number(storedClassId))) {
      setClassId(classes[0].id);
    }
  }, [classes.length, storedClassId, setClassId]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const { data, loading, error, reload } = useApi('/timetable');
  const allSlots = data?.slots || [];
  const slots = allSlots.filter((slot) => Number(slot.school_class_id) === Number(classId));
  const currentClass = classes.find((item) => Number(item.id) === Number(classId));
  const today = dayIndex(now);
  const todayLabel = DAYS[today - 1] || '';
  const baseWeekOffset = dayIndex(now) >= 6 ? 1 : 0;
  const weekStart = addDays(startOfWeek(now), weekOffset * 7);
  const weekLabel = weekRangeLabel(weekStart);
  const isCurrentWeek = sameWeek(weekStart, now);
  const liveSlot = isCurrentWeek ? slots.find((slot) => isSlotLive(slot, now)) : null;

  const totalHours = slots.reduce((sum, slot) => sum + slotDuration(slot), 0);
  const teacherCount = new Set(slots.map((slot) => slot.staff_id).filter(Boolean)).size;
  const todaySlots = slots.filter((slot) => Number(slot.day_of_week) === today);
  const visibleDays = viewDay ? [viewDay] : undefined;
  const weekPosition = weekOffset === baseWeekOffset
    ? (baseWeekOffset === 1 ? 'Semaine à venir' : 'Semaine en cours')
    : (weekOffset > baseWeekOffset ? 'Semaine suivante' : 'Semaine précédente');

  const changeWeek = (delta) => {
    setWeekOffset((value) => value + delta);
    setViewDay(null);
  };

  const addSlot = (day, hour) => actions.slot(null, {
    school_class_id: classId,
    day_of_week: day,
    starts_at: hour,
    ends_at: hour ? `${String(Math.min(23, Number(hour.slice(0, 2)) + 2)).padStart(2, '0')}:${hour.slice(3, 5)}` : '',
    term_id: meta?.term?.id,
  });

  const exportRows = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      if (!allSlots.length) {
        notify('Aucun emploi du temps à exporter.', { tone: 'danger' });
        return;
      }
      await exportTimetableWorkbook(allSlots, classes, {
        schoolName: meta?.school?.name,
        termName: meta?.term?.name,
        weekStart,
        weekLabel: `Semaine ${weekLabel}`,
      });
      notify(`Emplois du temps de la semaine ${weekLabel} exportés : ${classes.length} classe${classes.length > 1 ? 's' : ''}, ${allSlots.length} cours.`, { tone: 'success' });
    } catch (exportError) {
      notify(errorMessage(exportError, 'Export impossible.'), { tone: 'danger' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <PageHead
        id="emploi-du-temps"
        sub={`${currentClass?.name || 'Classe'} · ${slots.length} cours · ${number(totalHours, 1)} h / semaine · ${teacherCount} enseignant${teacherCount > 1 ? 's' : ''} · ${liveSlot ? 'cours en cours' : 'aucun cours en cours'}`}
        onPrimary={() => actions.slot(null, {
          school_class_id: classId,
          day_of_week: viewDay || (today > 5 ? 1 : today),
          term_id: meta?.term?.id,
        })}
        onSecondary={exportRows}
      />

      <div className="toolbar rise">
        {classes.length > 0 && (
          <Tabs
            items={classes.map((item) => item.name)}
            active={Math.max(0, classes.findIndex((item) => Number(item.id) === Number(classId)))}
            onChange={(index) => {
              const next = classes[index]?.id;
              setClassId(next);
              setViewDay(null);
              setWeekOffset(baseWeekOffset);
            }}
          />
        )}
        <div className="toolbar-right">
          <Pill tone="accent" dot>{meta?.term?.name || 'Année en cours'}</Pill>
          <Tabs
            items={['Semaine', "Aujourd’hui"]}
            active={viewDay ? 1 : 0}
            onChange={(index) => {
              if (index === 1) {
                setWeekOffset(0);
                setViewDay(today);
              } else {
                setWeekOffset(baseWeekOffset);
                setViewDay(null);
              }
            }}
          />
          <Btn icon="classes" onClick={() => { setClassId(classId); window.location.hash = 'classe'; }}>
            Fiche classe
          </Btn>
        </div>
      </div>

      <Card className={`tt-live-banner rise ${liveSlot ? 'is-live' : ''}`} style={{ animationDelay: '40ms' }}>
        <span className="tt-live-dot" />
        <div className="tt-live-main">
          <b>{liveSlot ? liveSlot.subject?.name || 'Cours' : 'Aucun cours en cours'}</b>
          <em>
            {liveSlot
              ? `${fullName(liveSlot.staff)} · ${liveSlot.room || liveSlot.school_class?.room || '—'} · ${time(liveSlot.starts_at)}–${time(liveSlot.ends_at)}`
              : `${currentClass?.name || 'Classe'} · ${todayLabel} ${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`}
          </em>
        </div>
        <span className="tt-live-side">
          {liveSlot
            ? <Pill tone="accent">En direct</Pill>
            : <Pill tone="muted">{todaySlots.length} cours aujourd’hui</Pill>}
        </span>
      </Card>

      <Card className="rise timetable-card" pad={false} style={{ animationDelay: '80ms' }}>
        {!viewDay && (
          <div className="tt-week-bar">
            <div className="tt-week-nav">
              <IconBtn icon="chevronL" title="Semaine précédente" onClick={() => changeWeek(-1)} />
              <div className="tt-week-label">
                <b>Semaine {weekLabel}</b>
                <span>{weekPosition}</span>
              </div>
              <IconBtn icon="chevronR" title="Semaine suivante" onClick={() => changeWeek(1)} />
            </div>
            <div className="tt-week-right">
              {weekOffset !== baseWeekOffset && (
                <Btn icon="calendar" onClick={() => { setWeekOffset(baseWeekOffset); setViewDay(null); }}>
                  {baseWeekOffset === 1 ? 'Semaine à venir' : 'Cette semaine'}
                </Btn>
              )}
            </div>
          </div>
        )}
        <ListState
          loading={loading && !data}
          error={error}
          empty={!loading && !error && !slots.length && !viewDay}
          emptyTitle={viewDay ? `Aucun cours ${viewDay === today ? 'aujourd’hui' : `le ${DAYS[viewDay - 1]?.toLowerCase()}`}` : 'Aucun cours cette semaine'}
          emptySub={viewDay ? 'Passez en vue semaine ou ajoutez un créneau.' : 'Cliquez sur une case du planning pour ajouter un créneau.'}
          onRetry={reload}
        >
          {viewDay && !todaySlots.length ? (
            <div className="tt-day-empty">
              <b>{viewDay === today ? 'Aucun cours programmé aujourd’hui' : `Aucun cours le ${DAYS[viewDay - 1]?.toLowerCase()}`}</b>
              <span>{currentClass?.name || 'Classe'} · {viewDay === today ? todayLabel : DAYS[viewDay - 1]}</span>
              <div className="tt-day-actions">
                <Btn icon="calendar" onClick={() => { setWeekOffset(baseWeekOffset); setViewDay(null); }}>Voir la semaine</Btn>
                {canManage && (
                  <Btn icon="plus" solid onClick={() => addSlot(viewDay, '08:00')}>Ajouter un cours</Btn>
                )}
              </div>
            </div>
          ) : (
            <WeekGrid
              slots={slots}
              days={visibleDays}
              weekStart={weekStart}
              today={today}
              now={now}
              readOnly={!canManage}
              onSlot={canManage ? (slot) => actions.slot(slot) : undefined}
              onAdd={canManage ? addSlot : undefined}
              onDelete={canManage ? (slot) => actions.deleteSlot(slot) : undefined}
            />
          )}
        </ListState>
      </Card>

      <div className="legend rise">
        <span><i className="lg-a" />Sciences</span>
        <span><i className="lg-b" />Lettres</span>
        <span><i className="lg-c" />Autres</span>
        <span className="legend-now"><i />Cours en cours (calculé sur l’heure actuelle)</span>
        {canManage && <span className="legend-hint">Cliquez sur une case vide pour ajouter un cours.</span>}
      </div>
    </>
  );
}
