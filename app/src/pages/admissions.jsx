import React, { useMemo, useState } from 'react';
import {
  Avatar, Btn, Card, Icon, Pill, Table, Tr, Tabs,
} from '../ui.jsx';
import {
  useApi, useData, useDebounced, number, date, fullName, initials, ADMISSION_STATUS,
} from '../data.jsx';
import { useActions } from '../actions.jsx';
import { api, errorMessage } from '../api.js';
import { exportAdmissionsWorkbook, fetchAllAdmissions } from '../exports.js';
import {
  ActionMenu, ListState, SearchInput, SelectFilter,
} from '../forms.jsx';
import { PageHead, AdmissionPill } from './common.jsx';

const COLUMNS = ['nouveau', 'entretien', 'valide', 'inscrit', 'refuse'];
const NEXT_STEP = {
  nouveau: ['entretien', 'valide', 'refuse'],
  entretien: ['valide', 'refuse'],
  valide: ['inscrit', 'refuse'],
  inscrit: [],
  refuse: ['nouveau'],
};

export function Admissions() {
  const {
    meta, refresh, notify, setAdmissionId,
  } = useData();
  const actions = useActions();
  const [view, setView] = useState(0);
  const [q, setQ] = useState('');
  const [classId, setClassId] = useState('');
  const [exporting, setExporting] = useState(false);
  const search = useDebounced(q);
  const { data, loading, error, reload } = useApi('/admissions', { per_page: 300 });
  const stats = useApi('/admissions/stats');
  const rows = data?.data || [];
  const classes = meta?.classes || [];

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((admission) => {
      if (classId && String(admission.desired_class_id) !== String(classId)) return false;
      if (!term) return true;
      return [fullName(admission), admission.reference, admission.guardian_name, admission.desired_class?.name]
        .filter(Boolean).join(' ').toLowerCase().includes(term);
    });
  }, [rows, classId, search]);

  const grouped = useMemo(() => COLUMNS.reduce((acc, status) => {
    acc[status] = filtered.filter((admission) => admission.status === status);
    return acc;
  }, {}), [filtered]);

  const counts = stats.data?.columns || [];
  const total = stats.data?.total || rows.length;
  const enrolled = rows.filter((admission) => admission.status === 'inscrit').length;
  const waiting = rows.filter((admission) => ['nouveau', 'entretien', 'valide'].includes(admission.status)).length;

  const openAdmission = (admission) => {
    setAdmissionId(admission.id);
    window.location.hash = 'fiche-admission';
  };

  const exportRows = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const all = await fetchAllAdmissions({
        q: search.trim() || undefined,
        class_id: classId || undefined,
      });
      if (!all.length) {
        notify('Aucun dossier à exporter.');
        return;
      }
      const className = classes.find((item) => String(item.id) === String(classId))?.name;
      const filterLabel = [
        search.trim() ? `recherche « ${search.trim()} »` : '',
        className ? `classe ${className}` : '',
      ].filter(Boolean).join(' · ');
      await exportAdmissionsWorkbook(all, {
        schoolName: meta?.school?.name,
        termName: meta?.term?.name,
        filterLabel,
      });
      notify(`${all.length} dossier${all.length > 1 ? 's' : ''} exporté${all.length > 1 ? 's' : ''}.`, { tone: 'success' });
    } catch (error) {
      notify(errorMessage(error, 'Export impossible.'), { tone: 'danger' });
    } finally {
      setExporting(false);
    }
  };

  const move = async (admission, status) => {
    try {
      await api.patch(`/admissions/${admission.id}`, { status });
      notify(`${fullName(admission)} · ${ADMISSION_STATUS[status]?.label || status}.`);
      refresh();
    } catch (err) {
      notify(err.message || 'Impossible de déplacer ce dossier.', { tone: 'danger' });
    }
  };

  const actionsFor = (admission) => [
    { label: 'Modifier le dossier', icon: 'edit', onClick: () => actions.admission(admission) },
    ...NEXT_STEP[admission.status].map((status) => ({
      label: `Marquer « ${ADMISSION_STATUS[status]?.label || status} »`,
      icon: status === 'refuse' ? 'close' : 'check',
      onClick: () => move(admission, status),
    })),
    admission.status !== 'inscrit' && {
      label: 'Inscrire dans la classe',
      icon: 'userPlus',
      onClick: () => actions.enrollAdmission(admission),
    },
    { label: 'Supprimer', icon: 'trash', tone: 'danger', onClick: () => actions.deleteAdmission(admission) },
  ];

  return (
    <>
      <PageHead
        id="admissions"
        sub={`${number(total)} dossiers · ${enrolled} inscrits · ${waiting} en cours d’étude`}
        onPrimary={() => actions.admission()}
        onSecondary={exportRows}
      />

      <div className="stats-row rise">
        <div className="stat"><b>{number(total)}</b><span>Dossiers reçus</span></div>
        <div className="stat"><b className="tone-accent">{number(enrolled)}</b><span>Inscriptions confirmées</span></div>
        <div className="stat"><b className="tone-copper">{number(waiting)}</b><span>En cours d’étude</span></div>
        <div className="stat"><b>{number(rows.filter((admission) => admission.status === 'refuse').length)}</b><span>Dossiers refusés</span></div>
      </div>

      <div className="toolbar rise">
        <Tabs items={['Pipeline', 'Liste']} active={view} onChange={setView} />
        <div className="toolbar-right">
          <SearchInput value={q} onChange={setQ} placeholder="Candidat, référence, responsable…" />
          <SelectFilter
            label="Classe demandée"
            value={classId}
            onChange={setClassId}
            options={[{ value: '', label: 'Toutes les classes' }, ...classes.map((item) => ({ value: item.id, label: item.name }))]}
          />
          <Btn icon="plus" solid onClick={() => actions.admission()}>Nouveau dossier</Btn>
        </div>
      </div>

      <ListState
        loading={loading && !data}
        error={error}
        empty={!loading && !error && !filtered.length}
        emptyTitle="Aucun dossier trouvé"
        emptySub="Modifiez la recherche ou créez une nouvelle candidature."
        onRetry={reload}
      >
        {view === 0 ? (
          <div className="kanban cols-5">
            {COLUMNS.map((status) => {
              const entry = ADMISSION_STATUS[status];
              const items = grouped[status] || [];
              return (
                <section className="kb-col" key={status}>
                  <header className="kb-head">
                    <span>
                      <i className={`status-dot tone-${entry.tone}`} />
                      {entry.label}
                    </span>
                    <em>{items.length}</em>
                  </header>
                  <div className="kb-body">
                    {items.map((admission) => (
                      <Card
                        key={admission.id}
                        className="kb-card rise"
                        onClick={() => openAdmission(admission)}
                        title={`Ouvrir le dossier de ${fullName(admission)}`}
                      >
                        <div className="kb-top">
                          <Avatar initials={initials(fullName(admission))} size={30} tone={status === 'refuse' ? 'muted' : 'accent'} />
                          <span>
                            <b>{fullName(admission)}</b>
                            <em>{admission.desired_class?.name || 'Classe à définir'}</em>
                          </span>
                        </div>
                        <div className="kb-meta">
                          <span className="mono">{admission.reference}</span>
                          <span className="mono">{date(admission.applied_on, { short: true })}</span>
                        </div>
                        {admission.guardian_name && (
                          <div className="kb-guardian">
                            <Icon name="profile" size={11} />
                            <span>{admission.guardian_name}</span>
                          </div>
                        )}
                        <div className="kb-foot" onClick={(event) => event.stopPropagation()}>
                          <span>{admission.notes ? admission.notes.slice(0, 28) : 'Dossier de candidature'}</span>
                          <ActionMenu actions={[
                            { label: 'Voir le dossier', icon: 'external', onClick: () => openAdmission(admission) },
                            ...actionsFor(admission),
                          ]} />
                        </div>
                      </Card>
                    ))}
                    {!items.length && (
                      <div className="kb-empty">Aucun dossier</div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <Card>
            <Table
              columns={['Candidat', 'Classe demandée', 'Responsable', 'Statut', 'Candidature', 'Décision', '']}
              template="1.5fr 1fr 1.2fr .8fr .8fr .8fr 34px"
              foot={<><span className="tf-l">{filtered.length} dossiers affichés</span><span className="tf-r">{number(total)} au total</span></>}
            >
              {filtered.map((admission) => (
                <Tr
                  key={admission.id}
                  template="1.5fr 1fr 1.2fr .8fr .8fr .8fr 34px"
                  onClick={() => openAdmission(admission)}
                  title={`Ouvrir le dossier de ${fullName(admission)}`}
                >
                  <span className="cell-who">
                    <Avatar initials={initials(fullName(admission))} size={28} tone={admission.status === 'refuse' ? 'muted' : 'accent'} />
                    <span>
                      <b>{fullName(admission)}</b>
                      <em className="mono">{admission.reference}</em>
                    </span>
                  </span>
                  <span className="cell">{admission.desired_class?.name || '—'}</span>
                  <span className="cell">
                    <b className="cell-title">{admission.guardian_name || '—'}</b>
                    <em className="cell-sub mono">{admission.guardian_phone || ''}</em>
                  </span>
                  <span className="cell"><AdmissionPill status={admission.status} /></span>
                  <span className="cell mono">{date(admission.applied_on)}</span>
                  <span className="cell mono">{admission.decision_on ? date(admission.decision_on) : '—'}</span>
                  <span className="cell right cell-actions" onClick={(event) => event.stopPropagation()}>
                    <ActionMenu actions={[
                      { label: 'Voir le dossier', icon: 'external', onClick: () => openAdmission(admission) },
                      ...actionsFor(admission),
                    ]} />
                  </span>
                </Tr>
              ))}
            </Table>
          </Card>
        )}
      </ListState>

      <div className="kanban-summary rise">
        {counts.map((column) => {
          const entry = ADMISSION_STATUS[column.status] || { label: column.label, tone: 'muted' };
          const percent = total ? Math.round((column.total / total) * 100) : 0;
          return (
            <span className="kanban-stat" key={column.status}>
              <i className={`status-dot tone-${entry.tone}`} />
              <b>{column.label}</b>
              <em className="mono">{column.total}</em>
              <span>{percent} %</span>
            </span>
          );
        })}
      </div>
    </>
  );
}
