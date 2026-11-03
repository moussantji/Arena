import React, { useMemo, useState } from 'react';
import {
  Avatar, Btn, Card, Pill, Progress, Tabs,
} from '../ui.jsx';
import { useApi, useData, number, fullName, initials } from '../data.jsx';
import { useActions } from '../actions.jsx';
import { errorMessage } from '../api.js';
import {
  exportLatestExamWorkbook, fetchLatestExamGrades,
} from '../exports.js';
import {
  ActionMenu, ListState, SearchInput,
} from '../forms.jsx';
import { PageHead } from './common.jsx';

export function Classes() {
  const { meta, setClassId, notify, can } = useData();
  const actions = useActions();
  const [q, setQ] = useState('');
  const [level, setLevel] = useState('');
  const [exporting, setExporting] = useState(false);
  const { data, loading, error, reload } = useApi('/classes');
  const rows = data?.classes || [];
  const studentsTotal = meta?.counts?.students || rows.reduce((sum, item) => sum + (item.students_count || 0), 0);
  const levels = Array.from(new Set(rows.map((item) => item.level))).sort();
  const tabs = ['Tous', ...levels];

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((item) => {
      if (level && item.level !== level) return false;
      if (!term) return true;
      return [item.name, item.level, item.room, item.head_teacher ? fullName(item.head_teacher) : '']
        .join(' ').toLowerCase().includes(term);
    });
  }, [rows, q, level]);

  const capacity = rows.reduce((sum, item) => sum + Number(item.capacity || 0), 0);
  const effectif = rows.reduce((sum, item) => sum + Number(item.students_count || 0), 0);
  const occupation = capacity ? Math.round((effectif / capacity) * 100) : 0;

  const openClass = (item) => {
    if (!item?.id) return;
    setClassId(item.id);
    window.location.hash = 'classe';
  };

  const exportRows = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const { grades, exam } = await fetchLatestExamGrades();
      if (!grades.length) {
        notify('Aucune note enregistrée pour le dernier examen.', { tone: 'danger' });
        return;
      }
      await exportLatestExamWorkbook(grades, exam, { schoolName: meta?.school?.name });
      notify(`Notes du dernier examen exportées : ${number(grades.length)} note${grades.length > 1 ? 's' : ''}.`, { tone: 'success' });
    } catch (exportError) {
      notify(errorMessage(exportError, 'Export impossible.'), { tone: 'danger' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <PageHead
        id="classes"
        sub={`${rows.length} classe${rows.length > 1 ? 's' : ''} · ${number(studentsTotal)} élèves · ${occupation} % d’occupation`}
        onPrimary={() => actions.classRoom()}
        onSecondary={exportRows}
      />

      <div className="toolbar rise">
        <Tabs items={tabs} active={Math.max(0, tabs.indexOf(level || 'Tous'))} onChange={(index) => setLevel(index === 0 ? '' : tabs[index])} />
        <div className="toolbar-right">
          <SearchInput value={q} onChange={setQ} placeholder="Classe, niveau, professeur…" />
          <span className="toolbar-count">{filtered.length} résultats</span>
        </div>
      </div>

      <div className="stats-row rise">
        <div className="stat"><b>{rows.length}</b><span>Classes ouvertes</span></div>
        <div className="stat"><b>{number(effectif ? effectif / Math.max(1, rows.length) : 0, 1)}</b><span>Élèves par classe</span></div>
        <div className="stat"><b className="tone-accent">{occupation} %</b><span>Taux d’occupation</span></div>
        <div className="stat"><b>{rows.filter((item) => item.level === 'Terminale').length}</b><span>Classes de terminale</span></div>
      </div>

      <ListState
        loading={loading && !data}
        error={error}
        empty={!loading && !error && !filtered.length}
        emptyTitle="Aucune classe à afficher"
        emptySub="Créez une classe pour organiser les élèves."
        onRetry={reload}
      >
        <div className="cards-grid">
          {filtered.map((item, index) => {
            const fill = item.capacity ? Math.round((item.students_count / item.capacity) * 100) : 0;
            return (
              <Card
                key={item.id}
                className={`class-card rise ${item.is_active ? 'active' : ''}`}
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => openClass(item)}
                title={`Ouvrir la fiche de ${item.name}`}
              >
                <div className="class-head">
                  <h3>{item.name}</h3>
                  {item.is_active ? <Pill tone="accent">Active</Pill> : <Pill tone="muted">Fermée</Pill>}
                </div>
                <div className="class-meta">
                  <span><b>{item.level}</b></span>
                  <span className="mono">{item.room || 'Salle —'}</span>
                </div>
                <div className="class-count">
                  <span>Effectif</span>
                  <b className="mono">{item.students_count || 0} <em>/ {item.capacity || '—'}</em></b>
                </div>
                <Progress value={fill} height={3} tone={fill > 95 ? 'copper' : 'accent'} />
                <div className="class-foot">
                  <span className="avatars">
                    <Avatar initials={item.head_teacher?.initials || initials(fullName(item.head_teacher))} size={22} tone="muted" src={item.head_teacher?.photo_url} />
                    <Avatar initials="ENS" size={22} tone="glass" />
                  </span>
                  <span className="class-teacher">
                    {item.head_teacher ? fullName(item.head_teacher) : 'Sans professeur principal'}
                    <em>{item.class_subjects_count || 0} matières</em>
                  </span>
                  <span className="class-actions" onClick={(event) => event.stopPropagation()}>
                    <ActionMenu actions={[
                      { label: 'Ouvrir la fiche', icon: 'external', onClick: () => openClass(item) },
                      { label: 'Modifier la classe', icon: 'edit', permission: 'classes.manage', onClick: () => actions.classRoom(item) },
                      { label: 'Voir les élèves', icon: 'students', onClick: () => { setClassId(item.id); window.location.hash = 'eleves'; } },
                      { label: 'Supprimer', icon: 'trash', tone: 'danger', permission: 'classes.manage', onClick: () => actions.deleteClass(item) },
                    ]} />
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      </ListState>

      {!loading && !error && !filtered.length && rows.length > 0 && (
        <div className="empty-action">
          <Btn icon="close" onClick={() => { setQ(''); setLevel(''); }}>Réinitialiser les filtres</Btn>
        </div>
      )}
      {!loading && !error && !rows.length && can('classes.manage') && (
        <div className="empty-action">
          <Btn icon="plus" solid onClick={() => actions.classRoom()}>Créer une classe</Btn>
        </div>
      )}
    </>
  );
}
