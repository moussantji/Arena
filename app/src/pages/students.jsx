import React, { useEffect, useState } from 'react';
import {
  Btn, Card, Pill, Table, Tr, Tabs,
} from '../ui.jsx';
import {
  useApi, useData, useDebounced, number, money, fullName, STUDENT_STATUS,
} from '../data.jsx';
import { useActions } from '../actions.jsx';
import { errorMessage } from '../api.js';
import { exportStudentsWorkbook, fetchAllStudents } from '../exports.js';
import {
  ActionMenu, ListState, Pager, SearchInput, SelectFilter,
} from '../forms.jsx';
import { PageHead, StudentCell, StatusPill, average } from './common.jsx';

export function Eleves() {
  const {
    meta, setStudentId, notify, classId, setClassId,
  } = useData();
  const actions = useActions();
  const [q, setQ] = useState('');
  const [level, setLevel] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState(0);
  const [exporting, setExporting] = useState(false);
  const debounced = useDebounced(q);

  const classes = meta?.classes || [];
  const levels = Array.from(new Set(classes.map((item) => item.level))).sort();
  const tabs = ['Tous', ...levels, 'Boursiers'];

  useEffect(() => {
    setPage(1);
  }, [debounced, level, status, classId]);

  useEffect(() => {
    if (tab === 0) { setLevel(''); setStatus(''); }
    else if (tab === tabs.length - 1) { setLevel(''); setStatus('boursier'); }
    else { setLevel(levels[tab - 1] || ''); setStatus(''); }
  }, [tab]);

  const query = {
    per_page: 12,
    page,
    q: debounced || undefined,
    level: level || undefined,
    status: status || undefined,
    class_id: classId || undefined,
  };
  const { data, loading, error, reload } = useApi('/students', query);
  const rows = data?.data || [];
  const total = data?.total || 0;
  const currency = meta?.school?.currency || 'FCFA';

  const resetFilters = () => {
    setQ('');
    setTab(0);
    setClassId(null);
  };

  const openStudent = (student) => {
    if (!student?.id) return;
    setStudentId(student.id);
    window.location.hash = 'fiche';
  };

  /* Exporte l'intégralité du fichier élèves dans un classeur Excel :
     un tableau bordé et titré pour chaque classe / filière. */
  const exportRows = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const students = await fetchAllStudents();
      await exportStudentsWorkbook(students, {
        schoolName: meta?.school?.name,
        termName: meta?.term?.name,
      });
      notify(`${number(students.length)} élève${students.length > 1 ? 's' : ''} exporté${students.length > 1 ? 's' : ''} par classe et filière.`, { tone: 'success' });
    } catch (error) {
      notify(errorMessage(error, 'Export impossible.'), { tone: 'danger' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <PageHead
        id="eleves"
        sub={`${number(total)} élève${total > 1 ? 's' : ''} · ${classes.length} classes · ${meta?.term?.name || 'année en cours'}`}
        onPrimary={() => actions.student()}
        onSecondary={exportRows}
      />

      <div className="toolbar rise">
        <Tabs items={tabs} active={tab} onChange={setTab} />
        <div className="toolbar-right">
          <SearchInput value={q} onChange={setQ} placeholder="Nom, matricule, tuteur…" />
          <SelectFilter
            label="Classe"
            value={classId}
            onChange={(value) => { setClassId(value ? Number(value) : null); setTab(0); setLevel(''); }}
            options={[{ value: '', label: 'Toutes' }, ...classes.map((item) => ({ value: item.id, label: item.name }))]}
          />
          <SelectFilter
            label="Statut"
            value={status}
            onChange={(value) => { setStatus(value); setTab(0); }}
            options={[{ value: '', label: 'Tous' }, ...Object.entries(STUDENT_STATUS).map(([value, item]) => ({ value, label: item.label }))]}
          />
          {(q || classId || status || level) && <Btn icon="close" onClick={resetFilters}>Effacer</Btn>}
        </div>
      </div>

      <Card className="rise" style={{ animationDelay: '80ms' }}>
        <ListState
          loading={loading && !data}
          error={error}
          empty={!loading && !error && !rows.length}
          emptyTitle="Aucun élève ne correspond à ces filtres"
          emptySub="Modifiez la recherche ou créez un nouveau dossier."
          onRetry={reload}
        >
          <Table
            columns={['Élève', 'Classe', 'Statut', 'Moyenne', 'Solde', '']}
            template="1.8fr .9fr .9fr .7fr 1fr 34px"
            foot={(
              <>
                <span className="tf-l">{data?.from || 0}–{data?.to || 0} sur {number(total)}</span>
                <Pager meta={data} onPage={setPage} />
              </>
            )}
          >
            {rows.map((student) => (
              <Tr
                key={student.id}
                template="1.8fr .9fr .9fr .7fr 1fr 34px"
                onClick={() => openStudent(student)}
                title={`Ouvrir la fiche de ${fullName(student)}`}
              >
                <StudentCell student={student} sub={`${student.school_class?.name || 'Sans classe'} · ${student.matricule}`} />
                <span className="cell">{student.school_class?.name || '—'}</span>
                <span className="cell"><StatusPill status={student.status} /></span>
                <span className="cell mono">{average(student.average)}</span>
                <span className={`cell mono right ${Number(student.balance) > 0 ? 'is-debt' : ''}`}>{money(student.balance ?? 0, currency)}</span>
                <span className="cell right cell-actions" onClick={(event) => event.stopPropagation()}>
                  <ActionMenu actions={[
                    { label: 'Ouvrir la fiche', icon: 'external', onClick: () => openStudent(student) },
                    { label: 'Aperçu rapide', icon: 'profile', onClick: () => actions.studentDrawer(student) },
                    { label: 'Modifier le dossier', icon: 'edit', onClick: () => actions.student(student) },
                    { label: 'Créer une facture', icon: 'finance', onClick: () => actions.invoice(null, { student_id: student.id }) },
                    { label: 'Supprimer', icon: 'trash', tone: 'danger', onClick: () => actions.deleteStudent(student) },
                  ]} />
                </span>
              </Tr>
            ))}
          </Table>
        </ListState>
        {loading && data && (
          <div className="table-loading"><span className="spinner" /> Actualisation…</div>
        )}
        {!loading && !error && !rows.length && data && (
          <div className="empty-action">
            <Btn icon="plus" solid onClick={() => actions.student()}>Nouvel élève</Btn>
          </div>
        )}
      </Card>
    </>
  );
}
