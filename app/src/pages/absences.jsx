import React, { useEffect, useMemo, useState } from 'react';
import {
  Btn, Card, CardHead, Icon, Pill, Table, Tr,
} from '../ui.jsx';
import {
  useApi, useData, useDebounced, number, date, time, fullName,
} from '../data.jsx';
import { useActions } from '../actions.jsx';
import {
  ActionMenu, exportCsv, ListState, Pager, SearchInput, SelectFilter,
} from '../forms.jsx';
import { PageHead, StudentCell } from './common.jsx';

const pad = (value) => String(value).padStart(2, '0');
const toIso = (year, month, day) => `${year}-${pad(month + 1)}-${pad(day)}`;
const monthBounds = (value) => {
  const year = value.getFullYear();
  const month = value.getMonth();
  const last = new Date(year, month + 1, 0).getDate();
  return {
    from: toIso(year, month, 1),
    to: toIso(year, month, last),
    label: new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(value),
  };
};

function MonthCalendar({ value, onChange, absences, onPick }) {
  const year = value.getFullYear();
  const month = value.getMonth();
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const counts = useMemo(() => {
    const map = new Map();
    absences.forEach((absence) => {
      const key = String(absence.date || '').slice(0, 10);
      const current = map.get(key) || { total: 0, pending: 0 };
      current.total += 1;
      if (!absence.is_justified) current.pending += 1;
      map.set(key, current);
    });
    return map;
  }, [absences]);

  return (
    <>
      <div className="cal-head">
        <button type="button" className="icon-btn" onClick={() => onChange(new Date(year, month - 1, 1))} aria-label="Mois précédent">
          <Icon name="chevronL" size={12} />
        </button>
        <b>{new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(value)}</b>
        <button type="button" className="icon-btn" onClick={() => onChange(new Date(year, month + 1, 1))} aria-label="Mois suivant">
          <Icon name="chevronR" size={12} />
        </button>
      </div>
      <div className="cal">
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, index) => (
          <span className="cal-dow" key={`${day}-${index}`}>{day}</span>
        ))}
        {Array.from({ length: offset }).map((_, index) => <span key={`blank-${index}`} />)}
        {Array.from({ length: days }).map((_, index) => {
          const day = index + 1;
          const key = toIso(year, month, day);
          const info = counts.get(key);
          const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
          return (
            <button
              key={key}
              type="button"
              className={`cal-day ${isToday ? 'today' : ''} ${info ? (info.pending ? 'late' : 'abs') : ''}`}
              onClick={() => onPick(key)}
              title={info ? `${info.total} absence${info.total > 1 ? 's' : ''}` : 'Aucune absence'}
            >
              {day}
              {info && <i />}
            </button>
          );
        })}
      </div>
    </>
  );
}

export function Absences() {
  const { meta } = useData();
  const actions = useActions();
  const [q, setQ] = useState('');
  const [classId, setClassId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [justified, setJustified] = useState('');
  const [page, setPage] = useState(1);
  const [month, setMonth] = useState(() => new Date());
  const search = useDebounced(q);
  const classes = meta?.classes || [];

  useEffect(() => { setPage(1); }, [search, classId, from, to, justified]);

  const { data, loading, error, reload } = useApi('/absences', {
    page,
    per_page: 12,
    q: search || undefined,
    class_id: classId || undefined,
    from: from || undefined,
    to: to || undefined,
    justified: justified === '' ? undefined : justified,
  });

  const bounds = monthBounds(month);
  const monthAbsences = useApi('/absences', {
    from: bounds.from,
    to: bounds.to,
    per_page: 300,
  });

  const rows = data?.data || [];
  const total = Number(data?.total || 0);
  const stats = data?.stats || {};
  const pending = rows.filter((absence) => !absence.is_justified);
  const monthRows = monthAbsences.data?.data || [];
  const monthUnjustified = monthRows.filter((absence) => !absence.is_justified);

  const reasons = useMemo(() => {
    const map = new Map();
    rows.forEach((absence) => {
      const key = absence.reason || 'Non précisé';
      map.set(key, (map.get(key) || 0) + 1);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [rows]);

  const reset = () => {
    setQ('');
    setClassId('');
    setFrom('');
    setTo('');
    setJustified('');
  };

  const pickDay = (day) => {
    setFrom(day);
    setTo(day);
    setPage(1);
  };

  const exportRows = () => exportCsv('diallo-absences', [
    { label: 'Élève', value: (row) => fullName(row.student) },
    { label: 'Matricule', value: (row) => row.student?.matricule || '' },
    { label: 'Classe', value: (row) => row.student?.school_class?.name || row.school_class?.name || '' },
    { label: 'Date', value: (row) => date(row.date) },
    { label: 'Début', value: (row) => time(row.starts_at) },
    { label: 'Fin', value: (row) => time(row.ends_at) },
    { label: 'Motif', value: (row) => row.reason || '' },
    { label: 'Justifiée', value: (row) => (row.is_justified ? 'Oui' : 'Non') },
    { label: 'Justification', value: (row) => row.justification || '' },
  ], rows);

  const statTotal = stats.total ?? total;
  const statUnjustified = stats.unjustified ?? monthUnjustified.length;
  const statRate = stats.justified_rate ?? (monthRows.length
    ? (monthRows.filter((absence) => absence.is_justified).length / monthRows.length) * 100
    : 0);

  return (
    <>
      <PageHead
        id="absences"
        sub={`${number(statTotal)} absences · ${number(statUnjustified)} non justifiées · ${number(statRate, 1)} % de justificatifs`}
        onPrimary={() => actions.absence()}
        onSecondary={exportRows}
      />

      <div className="stats-row rise">
        <div className="stat"><b>{number(statTotal)}</b><span>Absences enregistrées</span></div>
        <div className="stat"><b className="tone-copper">{number(statUnjustified)}</b><span>À justifier</span></div>
        <div className="stat"><b className="tone-accent">{number(statRate, 1)} %</b><span>Taux de justification</span></div>
        <div className="stat"><b>{monthRows.length}</b><span>Ce mois-ci</span></div>
      </div>

      <div className="toolbar rise">
        <div className="toolbar-group">
          <SearchInput value={q} onChange={setQ} placeholder="Élève, matricule…" />
          <SelectFilter
            label="Classe"
            value={classId}
            onChange={setClassId}
            options={[{ value: '', label: 'Toutes' }, ...classes.map((item) => ({ value: item.id, label: item.name }))]}
          />
          <label className="date-filter">
            <span>Du</span>
            <input type="date" className="input" value={from} onChange={(event) => setFrom(event.target.value)} />
          </label>
          <label className="date-filter">
            <span>Au</span>
            <input type="date" className="input" value={to} onChange={(event) => setTo(event.target.value)} />
          </label>
          <SelectFilter
            label="Justification"
            value={justified}
            onChange={setJustified}
            options={[
              { value: '', label: 'Toutes' },
              { value: '0', label: 'Non justifiées' },
              { value: '1', label: 'Justifiées' },
            ]}
          />
        </div>
        <div className="toolbar-right">
          {(q || classId || from || to || justified) && <Btn icon="close" onClick={reset}>Effacer</Btn>}
          <Btn icon="plus" solid onClick={() => actions.absence()}>Enregistrer une absence</Btn>
        </div>
      </div>

      <div className="grid-main">
        <Card className="rise" style={{ animationDelay: '80ms' }}>
          <ListState
            loading={loading && !data}
            error={error}
            empty={!loading && !error && !rows.length}
            emptyTitle="Aucune absence trouvée"
            emptySub="Ajustez la période ou enregistrez une nouvelle absence."
            onRetry={reload}
          >
            <Table
              columns={['Élève', 'Date', 'Créneau', 'Motif', 'Statut', '']}
              template="1.8fr .8fr .8fr 1fr .9fr 34px"
              foot={(
                <>
                  <span className="tf-l">
                    {data?.from || 0}–{data?.to || 0} sur {number(total)}
                    <em className="tf-sub">{pending.length} absences à traiter sur cette page</em>
                  </span>
                  <Pager meta={data} onPage={setPage} />
                </>
              )}
            >
              {rows.map((absence) => (
                <Tr key={absence.id} template="1.8fr .8fr .8fr 1fr .9fr 34px">
                  <StudentCell student={absence.student} sub={`${absence.school_class?.name || absence.student?.school_class?.name || '—'}`} />
                  <span className="cell mono">{date(absence.date)}</span>
                  <span className="cell mono">{time(absence.starts_at)}–{time(absence.ends_at)}</span>
                  <span className="cell">
                    <b className="cell-title">{absence.reason || 'Non précisé'}</b>
                    {absence.justification && <em className="cell-sub">{absence.justification.slice(0, 40)}</em>}
                  </span>
                  <span className="cell">
                    {absence.is_justified
                      ? <Pill tone="accent">Justifiée</Pill>
                      : <Pill tone="copper">À justifier</Pill>}
                  </span>
                  <span className="cell right cell-actions">
                    <ActionMenu actions={[
                      !absence.is_justified && { label: 'Justifier', icon: 'check', onClick: () => actions.justifyAbsence(absence) },
                      { label: 'Modifier', icon: 'edit', onClick: () => actions.absence(absence) },
                      { label: 'Supprimer', icon: 'trash', tone: 'danger', onClick: () => actions.deleteAbsence(absence) },
                    ]} />
                  </span>
                </Tr>
              ))}
            </Table>
          </ListState>
          {loading && data && <div className="table-loading"><span className="spinner" /> Actualisation…</div>}
        </Card>

        <div className="stack">
          <Card className="rise" style={{ animationDelay: '130ms' }}>
            <CardHead
              title="Calendrier"
              sub="Absences du mois"
              right={<Pill tone={monthUnjustified.length ? 'copper' : 'accent'}>{monthUnjustified.length} à traiter</Pill>}
            />
            <MonthCalendar
              value={month}
              onChange={setMonth}
              absences={monthRows}
              onPick={pickDay}
            />
            <div className="cal-legend">
              <span><i className="cal-dot abs" />Justifiées</span>
              <span><i className="cal-dot late" />À justifier</span>
              <span className="cal-hint">Cliquez un jour pour filtrer</span>
            </div>
          </Card>

          <Card className="rise" style={{ animationDelay: '180ms' }}>
            <CardHead title="À justifier" sub={`${monthUnjustified.length} absences ce mois`} />
            {monthUnjustified.length ? (
              <ul className="task-list">
                {monthUnjustified.slice(0, 4).map((absence) => (
                  <li key={absence.id}>
                    <span className="task-date mono">{date(absence.date, { short: true })}</span>
                    <span className="task-main">
                      <b>{fullName(absence.student)}</b>
                      <em>{absence.reason || 'Motif non précisé'} · {time(absence.starts_at)}</em>
                    </span>
                    <button type="button" className="icon-btn" title="Justifier" onClick={() => actions.justifyAbsence(absence)}>
                      <Icon name="check" size={13} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : <div className="state-inline">Toutes les absences du mois sont justifiées.</div>}
            {monthUnjustified.length > 4 && (
              <div className="mini-actions">
                <Btn icon="absences" onClick={() => { setJustified('0'); setFrom(bounds.from); setTo(bounds.to); }}>Voir tout</Btn>
              </div>
            )}
          </Card>

          {reasons.length > 0 && (
            <Card className="rise" style={{ animationDelay: '230ms' }}>
              <CardHead title="Motifs" sub="Sur la page courante" />
              <ul className="reason-list">
                {reasons.map(([reason, count]) => (
                  <li key={reason}>
                    <span>{reason}</span>
                    <b className="mono">{count}</b>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
