import React, { useMemo, useState } from 'react';
import {
  Btn, Card, CardHead, Pill, Progress, Table, Tr, Tabs, HBarList,
} from '../ui.jsx';
import { useApi, useData, number, useDebounced } from '../data.jsx';
import { useActions } from '../actions.jsx';
import { errorMessage } from '../api.js';
import { exportSubjectsWorkbook } from '../exports.js';
import {
  ActionMenu, ListState, SearchInput,
} from '../forms.jsx';
import { PageHead, average } from './common.jsx';

const toneFor = (id) => ['accent', 'success', 'copper'][Number(id || 0) % 3];

export function Matieres() {
  const { meta, notify, can } = useData();
  const actions = useActions();
  const [q, setQ] = useState('');
  const [department, setDepartment] = useState('');
  const [exporting, setExporting] = useState(false);
  const search = useDebounced(q);
  const { data, loading, error, reload } = useApi('/subjects', { q: search || undefined });
  const rows = data?.subjects || [];
  const departments = meta?.departments || [];
  const tabs = ['Toutes', ...departments.map((item) => item.name)];

  const filtered = useMemo(() => {
    if (!department) return rows;
    return rows.filter((subject) => subject.department?.name === department);
  }, [rows, department]);

  const active = rows.filter((subject) => subject.is_active);
  const withAverage = rows.filter((subject) => subject.average != null);
  const globalAverage = withAverage.length
    ? withAverage.reduce((sum, subject) => sum + Number(subject.average), 0) / withAverage.length
    : 0;
  const weeklyHours = rows.reduce((sum, subject) => sum + Number(subject.weekly_hours || 0), 0);
  const teachers = new Set(rows.flatMap((subject) => subject.teacher_ids || [])).size;

  const departmentHours = useMemo(() => {
    const totals = departments.map((item) => ({
      label: item.name,
      value: rows
        .filter((subject) => subject.department_id === item.id)
        .reduce((sum, subject) => sum + Number(subject.weekly_hours || 0), 0),
    })).filter((item) => item.value > 0);
    const total = totals.reduce((sum, item) => sum + item.value, 0) || 1;
    return totals
      .map((item) => ({ label: item.label, v: Math.round((item.value / total) * 100), hours: item.value }))
      .sort((a, b) => b.v - a.v);
  }, [departments, rows]);

  const strongest = [...rows]
    .filter((subject) => subject.average != null)
    .sort((a, b) => Number(b.average) - Number(a.average))
    .slice(0, 3);

  const exportRows = async () => {
    if (!filtered.length || exporting) return;
    setExporting(true);
    try {
      await exportSubjectsWorkbook(filtered, {
        schoolName: meta?.school?.name,
        termName: meta?.term?.name,
      });
      notify(`${filtered.length} matière${filtered.length > 1 ? 's' : ''} exportée${filtered.length > 1 ? 's' : ''}.`, { tone: 'success' });
    } catch (error) {
      notify(errorMessage(error, 'Export impossible.'), { tone: 'danger' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <PageHead
        id="matieres"
        sub={`${rows.length} matières · ${active.length} actives · ${number(weeklyHours)} h hebdomadaires`}
        onPrimary={() => actions.subject()}
        onSecondary={exportRows}
      />

      <div className="stats-row rise">
        <div className="stat"><b>{rows.length}</b><span>Matières au catalogue</span></div>
        <div className="stat"><b className="tone-accent">{number(globalAverage, 2)}</b><span>Moyenne générale / 20</span></div>
        <div className="stat"><b>{weeklyHours} h</b><span>Volume hebdomadaire</span></div>
        <div className="stat"><b>{departments.length}</b><span>Départements</span></div>
      </div>

      <div className="toolbar rise">
        <Tabs items={tabs} active={Math.max(0, tabs.indexOf(department || 'Toutes'))} onChange={(index) => setDepartment(index === 0 ? '' : tabs[index])} />
        <div className="toolbar-right">
          <SearchInput value={q} onChange={setQ} placeholder="Matière, code, département…" />
          <span className="toolbar-count">{filtered.length} résultats</span>
        </div>
      </div>

      <div className="grid-main">
        <Card className="rise" style={{ animationDelay: '80ms' }}>
          <ListState
            loading={loading && !data}
            error={error}
            empty={!loading && !error && !filtered.length}
            emptyTitle="Aucune matière trouvée"
            emptySub="Créez une matière ou changez de département."
            onRetry={reload}
          >
            <Table
              columns={['Matière', 'Code', 'Département', 'Classes', 'Coef.', 'Moyenne', '']}
              template="1.6fr .6fr 1fr .7fr .5fr 1fr 34px"
              foot={<><span className="tf-l">{filtered.length} matières affichées</span><span className="tf-r">{number(weeklyHours)} h / semaine</span></>}
            >
              {filtered.map((subject) => (
                <Tr key={subject.id} template="1.6fr .6fr 1fr .7fr .5fr 1fr 34px">
                  <span className="cell subject-cell">
                    <i className={`subj-dot tone-${toneFor(subject.department_id)}`} />
                    <span>
                      <b>{subject.name}</b>
                      <em>{subject.teachers_count || 0} enseignant{subject.teachers_count > 1 ? 's' : ''}</em>
                    </span>
                  </span>
                  <span className="cell mono">{subject.code}</span>
                  <span className="cell">{subject.department?.name || '—'}</span>
                  <span className="cell mono">{subject.classes_count || 0}</span>
                  <span className="cell mono">{Number(subject.coefficient || 0)}</span>
                  <span className="cell grade-cell">
                    <span className="cell mono">{average(subject.average)}</span>
                    {subject.average != null && (
                      <Progress value={(Number(subject.average) / 20) * 100} height={3} tone={Number(subject.average) >= 12 ? 'accent' : 'copper'} />
                    )}
                  </span>
                  <span className="cell right cell-actions">
                    <ActionMenu actions={[
                      { label: 'Modifier', icon: 'edit', permission: 'subjects.manage', onClick: () => actions.subject(subject) },
                      { label: 'Supprimer', icon: 'trash', tone: 'danger', permission: 'subjects.manage', onClick: () => actions.deleteSubject(subject) },
                    ]} />
                  </span>
                </Tr>
              ))}
            </Table>
          </ListState>
          {!loading && !error && !filtered.length && rows.length > 0 && (
            <div className="empty-action">
              <Btn icon="close" onClick={() => { setQ(''); setDepartment(''); }}>Réinitialiser les filtres</Btn>
            </div>
          )}
        </Card>

        <div className="stack">
          <Card className="rise" style={{ animationDelay: '140ms' }}>
            <CardHead title="Volume par département" sub="Part des heures hebdomadaires" />
            {departmentHours.length ? <HBarList items={departmentHours} /> : <div className="state-inline">Aucune heure planifiée.</div>}
          </Card>

          <Card className="rise" style={{ animationDelay: '200ms' }}>
            <CardHead title="Meilleures moyennes" sub="Matières les mieux réussies" />
            {strongest.length ? (
              <ul className="rank-list">
                {strongest.map((subject, index) => (
                  <li key={subject.id}>
                    <span className="rank-index mono">{String(index + 1).padStart(2, '0')}</span>
                    <span className="rank-main">
                      <b>{subject.name}</b>
                      <em>{subject.department?.name || '—'} · coef. {Number(subject.coefficient || 0)}</em>
                    </span>
                    <span className="rank-value mono">{average(subject.average)}</span>
                  </li>
                ))}
              </ul>
            ) : <div className="state-inline">Aucune note enregistrée.</div>}
            <div className="mini-actions">
              <Btn icon="grades" onClick={() => { window.location.hash = 'notes'; }}>Ouvrir les notes</Btn>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
