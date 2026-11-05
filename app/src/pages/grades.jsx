import React, { useEffect, useMemo, useState } from 'react';
import {
  Btn, Card, CardHead, Icon, Pill, Progress, Table, Tr,
} from '../ui.jsx';
import {
  useApi, useData, useDebounced, number, date, fullName, EVALUATIONS,
} from '../data.jsx';
import { useActions } from '../actions.jsx';
import {
  ActionMenu, exportCsv, ListState, Pager, SearchInput, SelectFilter,
} from '../forms.jsx';
import { PageHead, StudentCell, average } from './common.jsx';

const scoreTone = (score, max = 20) => {
  const value = (Number(score) / Number(max || 20)) * 20;
  if (value >= 15) return 'accent';
  if (value >= 10) return 'glass';
  return 'copper';
};

export function Notes() {
  const { meta, can } = useData();
  const actions = useActions();
  const [q, setQ] = useState('');
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [termId, setTermId] = useState('');
  const [evaluation, setEvaluation] = useState('');
  const [page, setPage] = useState(1);
  const search = useDebounced(q);
  const classes = meta?.classes || [];
  const subjects = meta?.subjects || [];
  const terms = meta?.terms || [];

  useEffect(() => { setPage(1); }, [search, classId, subjectId, termId, evaluation]);

  const { data, loading, error, reload } = useApi('/grades', {
    page,
    per_page: 15,
    q: search || undefined,
    class_id: classId || undefined,
    subject_id: subjectId || undefined,
    term_id: termId || undefined,
    evaluation: evaluation || undefined,
  });

  const rows = data?.data || [];
  const stats = data?.stats || {};
  const total = Number(data?.total || 0);
  const pageAverage = rows.length
    ? rows.reduce((sum, row) => sum + (Number(row.score) / Number(row.max_score || 20)) * 20, 0) / rows.length
    : 0;
  const currentClass = classes.find((item) => String(item.id) === String(classId));
  const currentSubject = subjects.find((item) => String(item.id) === String(subjectId));
  const currentTerm = terms.find((item) => String(item.id) === String(termId));
  const selectedTerm = termId ? currentTerm : meta?.term;
  const lockedTerm = selectedTerm?.locked_at ? selectedTerm : null;

  const distribution = useMemo(() => {
    const buckets = [0, 0, 0, 0, 0];
    rows.forEach((row) => {
      const value = (Number(row.score) / Number(row.max_score || 20)) * 20;
      if (value < 5) buckets[0] += 1;
      else if (value < 10) buckets[1] += 1;
      else if (value < 15) buckets[2] += 1;
      else if (value < 18) buckets[3] += 1;
      else buckets[4] += 1;
    });
    const max = Math.max(...buckets, 1);
    return [
      { label: '0–5', count: buckets[0] },
      { label: '5–10', count: buckets[1] },
      { label: '10–15', count: buckets[2] },
      { label: '15–18', count: buckets[3] },
      { label: '18–20', count: buckets[4] },
    ].map((bucket) => ({ ...bucket, percent: Math.round((bucket.count / max) * 100) }));
  }, [rows]);

  const reset = () => {
    setQ('');
    setClassId('');
    setSubjectId('');
    setTermId('');
    setEvaluation('');
  };

  const exportRows = () => exportCsv('kalanso-notes', [
    { label: 'Élève', value: (row) => fullName(row.student) },
    { label: 'Matricule', value: (row) => row.student?.matricule || '' },
    { label: 'Classe', value: (row) => row.school_class?.name || '' },
    { label: 'Matière', value: (row) => row.subject?.name || '' },
    { label: 'Évaluation', value: (row) => EVALUATIONS[row.evaluation] || row.evaluation },
    { label: 'Note', value: (row) => Number(row.score) },
    { label: 'Barème', value: (row) => Number(row.max_score) },
    { label: 'Coefficient', value: (row) => Number(row.coefficient) },
    { label: 'Date', value: (row) => date(row.evaluated_on) },
  ], rows);

  return (
    <>
      <PageHead
        id="notes"
        sub={`${number(total)} notes · ${currentClass?.name || 'toutes les classes'} · ${currentSubject?.name || 'toutes les matières'} · ${currentTerm?.name || 'année en cours'}`}
        primary={lockedTerm ? null : undefined}
        onPrimary={lockedTerm ? undefined : () => actions.grade(null, { school_class_id: classId || undefined, subject_id: subjectId || undefined, term_id: termId || undefined })}
        onSecondary={exportRows}
      />

      {lockedTerm && (
        <div className="form-alert rise" role="alert" style={{ marginBottom: 14 }}>
          <Icon name="clock" size={14} />
          <span>
            <b>Période délibérée et verrouillée.</b>{' '}
            Aucune note de « {lockedTerm.name} » ne peut être créée, modifiée ou supprimée.
            {can('settings.manage') && ' La Direction peut la rouvrir depuis Paramètres → Calendrier.'}
          </span>
        </div>
      )}

      <div className="stats-row rise">
        <div className="stat"><b>{number(total)}</b><span>Notes enregistrées</span></div>
        <div className="stat"><b className="tone-accent">{number(stats.average ?? pageAverage, 2)}</b><span>Moyenne générale</span></div>
        <div className="stat"><b>{number(stats.best ?? Math.max(...rows.map((row) => (Number(row.score) / Number(row.max_score || 20)) * 20), 0), 2)}</b><span>Meilleure note</span></div>
        <div className="stat"><b>{number(stats.below_ten ?? rows.filter((row) => (Number(row.score) / Number(row.max_score || 20)) * 20 < 10).length)}</b><span>Notes sous 10</span></div>
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
          <SelectFilter
            label="Matière"
            value={subjectId}
            onChange={setSubjectId}
            options={[{ value: '', label: 'Toutes' }, ...subjects.map((item) => ({ value: item.id, label: item.name }))]}
          />
          <SelectFilter
            label="Évaluation"
            value={evaluation}
            onChange={setEvaluation}
            options={[{ value: '', label: 'Toutes' }, ...Object.entries(EVALUATIONS).map(([value, label]) => ({ value, label }))]}
          />
          <SelectFilter
            label="Période"
            value={termId}
            onChange={setTermId}
            options={[{ value: '', label: 'Toutes' }, ...terms.map((item) => ({ value: item.id, label: item.name }))]}
          />
        </div>
        <div className="toolbar-right">
          {(q || classId || subjectId || termId || evaluation) && <Btn icon="close" onClick={reset}>Effacer</Btn>}
          {can('grades.manage') && (
            <Btn
              icon="plus"
              solid
              disabled={Boolean(lockedTerm)}
              title={lockedTerm ? 'Période délibérée et verrouillée' : undefined}
              onClick={() => actions.grade(null, { school_class_id: classId || undefined, subject_id: subjectId || undefined, term_id: termId || undefined })}
            >
              Saisir une note
            </Btn>
          )}
        </div>
      </div>

      <div className="grid-main">
        <Card className="rise" style={{ animationDelay: '80ms' }}>
          <ListState
            loading={loading && !data}
            error={error}
            empty={!loading && !error && !rows.length}
            emptyTitle="Aucune note trouvée"
            emptySub="Modifiez les filtres ou saisissez une nouvelle évaluation."
            onRetry={reload}
          >
            <Table
              columns={['Élève', 'Matière', 'Évaluation', 'Note', 'Coef.', 'Date', '']}
              template="1.7fr 1.1fr 1fr .8fr .5fr .8fr 34px"
              foot={(
                <>
                  <span className="tf-l">
                    {data?.from || 0}–{data?.to || 0} sur {number(total)}
                    <em className="tf-sub">Moyenne de la page : {number(pageAverage, 2)} / 20</em>
                  </span>
                  <Pager meta={data} onPage={setPage} />
                </>
              )}
            >
              {rows.map((grade) => (
                <Tr key={grade.id} template="1.7fr 1.1fr 1fr .8fr .5fr .8fr 34px">
                  <StudentCell student={grade.student} sub={`${grade.school_class?.name || '—'} · ${grade.student?.matricule || ''}`} />
                  <span className="cell">
                    <b className="cell-title">{grade.subject?.name || '—'}</b>
                    <em className="cell-sub">{grade.subject?.code || ''}</em>
                  </span>
                  <span className="cell">{EVALUATIONS[grade.evaluation] || grade.evaluation}</span>
                  <span className="cell">
                    <Pill tone={scoreTone(grade.score, grade.max_score)}>
                      {Number(grade.score)} / {Number(grade.max_score || 20)}
                    </Pill>
                  </span>
                  <span className="cell mono">{Number(grade.coefficient || 0)}</span>
                  <span className="cell mono">{date(grade.evaluated_on)}</span>
                  <span className="cell right cell-actions">
                    <ActionMenu actions={lockedTerm ? [] : [
                      { label: 'Modifier la note', icon: 'edit', permission: 'grades.manage', onClick: () => actions.grade(grade) },
                      { label: 'Supprimer', icon: 'trash', tone: 'danger', permission: 'grades.manage', onClick: () => actions.deleteGrade(grade) },
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
            <CardHead title="Répartition" sub="Notes de la page courante" />
            <div className="dist-list">
              {distribution.map((bucket) => (
                <div className="dist-row" key={bucket.label}>
                  <span className="dist-label mono">{bucket.label}</span>
                  <span className="dist-track"><i style={{ width: `${bucket.percent}%` }} /></span>
                  <span className="dist-value mono">{bucket.count}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="rise" style={{ animationDelay: '180ms' }}>
            <CardHead title="Repères" sub="Lecture rapide" />
            <dl className="dl">
              <div><dt>Matières suivies</dt><dd>{subjects.length}</dd></div>
              <div><dt>Évaluations par matière</dt><dd>{Object.keys(EVALUATIONS).length}</dd></div>
              <div><dt>Barème standard</dt><dd className="mono">20 points</dd></div>
              <div><dt>Moyenne de la page</dt><dd className="mono">{number(pageAverage, 2)} / 20</dd></div>
            </dl>
            <div className="mini-actions">
              <Btn icon="profile" onClick={() => { window.location.hash = 'fiche'; }}>Consulter un bulletin</Btn>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
