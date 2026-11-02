import React, { useMemo, useState } from 'react';
import {
  Avatar, Btn, Card, Pill, Tabs,
} from '../ui.jsx';
import {
  useApi, useData, number, date, fullName, initials,
} from '../data.jsx';
import { useActions } from '../actions.jsx';
import { errorMessage } from '../api.js';
import { exportStaffWorkbook } from '../exports.js';
import {
  ActionMenu, ListState, SearchInput, SelectFilter,
} from '../forms.jsx';
import { PageHead } from './common.jsx';

const isTeacher = (member) => /professeur|enseignant/i.test(member.role || '');

export function Personnel() {
  const {
    meta, setStaffId, notify,
  } = useData();
  const actions = useActions();
  const [q, setQ] = useState('');
  const [department, setDepartment] = useState('');
  const [group, setGroup] = useState(0);
  const [exporting, setExporting] = useState(false);
  const { data, loading, error, reload } = useApi('/staff');
  const rows = data?.staff || [];
  const departments = meta?.departments || [];

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((member) => {
      if (department && String(member.department_id) !== String(department)) return false;
      if (group === 1 && !isTeacher(member)) return false;
      if (group === 2 && isTeacher(member)) return false;
      if (!term) return true;
      return [fullName(member), member.role, member.email, member.phone, member.department?.name]
        .filter(Boolean).join(' ').toLowerCase().includes(term);
    });
  }, [rows, q, department, group]);

  const teachers = rows.filter(isTeacher).length;
  const experience = rows.length
    ? rows.reduce((sum, member) => sum + Number(member.years_experience || 0), 0) / rows.length
    : 0;

  const openMember = (member) => {
    setStaffId(member.id);
    window.location.hash = 'fiche-personnel';
  };

  const exportRows = async () => {
    if (!filtered.length || exporting) return;
    setExporting(true);
    try {
      await exportStaffWorkbook(filtered, {
        schoolName: meta?.school?.name,
        termName: meta?.term?.name,
      });
      notify(`${filtered.length} membre${filtered.length > 1 ? 's' : ''} exporté${filtered.length > 1 ? 's' : ''}.`, { tone: 'success' });
    } catch (error) {
      notify(errorMessage(error, 'Export impossible.'), { tone: 'danger' });
    } finally {
      setExporting(false);
    }
  };

  const reset = () => {
    setQ('');
    setDepartment('');
    setGroup(0);
  };

  return (
    <>
      <PageHead
        id="personnel"
        sub={`${rows.length} membres · ${teachers} enseignants · ${departments.length} départements`}
        onPrimary={() => actions.staff()}
        onSecondary={exportRows}
      />

      <div className="stats-row rise">
        <div className="stat"><b>{rows.length}</b><span>Membres de l’équipe</span></div>
        <div className="stat"><b className="tone-accent">{teachers}</b><span>Enseignants</span></div>
        <div className="stat"><b>{number(experience, 1)} ans</b><span>Expérience moyenne</span></div>
        <div className="stat"><b>{number(rows.filter((member) => member.is_active).length)}</b><span>En poste</span></div>
      </div>

      <div className="toolbar rise">
        <Tabs
          items={['Tous', 'Enseignants', 'Administration']}
          active={group}
          onChange={setGroup}
        />
        <div className="toolbar-right">
          <SearchInput value={q} onChange={setQ} placeholder="Nom, fonction, contact…" />
          <SelectFilter
            label="Département"
            value={department}
            onChange={setDepartment}
            options={[{ value: '', label: 'Tous' }, ...departments.map((item) => ({ value: item.id, label: item.name }))]}
          />
          <span className="toolbar-count">{filtered.length} résultats</span>
        </div>
      </div>

      <ListState
        loading={loading && !data}
        error={error}
        empty={!loading && !error && !filtered.length}
        emptyTitle="Aucun membre ne correspond"
        emptySub="Ajustez les filtres ou ajoutez un nouveau membre à l’équipe."
        onRetry={reload}
      >
        <div className="cards-grid staff-grid">
          {filtered.map((member, index) => (
            <Card
              key={member.id}
              className="staff-card rise"
              style={{ animationDelay: `${index * 45}ms` }}
              onClick={() => openMember(member)}
              title={`Ouvrir la fiche de ${fullName(member)}`}
            >
              <Avatar initials={member.initials || initials(fullName(member))} size={46} tone={isTeacher(member) ? 'accent' : 'muted'} src={member.photo_url} />
              <h3>{fullName(member)}</h3>
              <p>{member.role}</p>
              <div className="staff-tags">
                {member.department && <Pill tone="muted">{member.department.name}</Pill>}
                <Pill tone={member.is_active ? 'accent' : 'danger'}>{member.is_active ? 'En poste' : 'Inactif'}</Pill>
                <Pill tone="copper">{member.years_experience || 0} ans</Pill>
              </div>
              <div className="staff-contact">
                {member.email && <span title={member.email}>{member.email}</span>}
                {member.phone && <span className="mono">{member.phone}</span>}
                <span className="mono">Embauché le {date(member.hired_on)}</span>
              </div>
              <div className="staff-foot" onClick={(event) => event.stopPropagation()}>
                <span className="mono">
                  {member.class_subjects_count || 0} cours · {member.head_teacher_classes_count || 0} classes
                </span>
                <ActionMenu actions={[
                  { label: 'Voir la fiche', icon: 'profile', onClick: () => openMember(member) },
                  { label: 'Modifier', icon: 'edit', onClick: () => actions.staff(member) },
                  { label: 'Changer la photo', icon: 'upload', onClick: () => actions.photo(member, { kind: 'staff' }) },
                  { label: 'Supprimer', icon: 'trash', tone: 'danger', onClick: () => actions.deleteStaff(member) },
                ]} />
              </div>
            </Card>
          ))}
        </div>
      </ListState>

      {!loading && !error && !filtered.length && rows.length > 0 && (
        <div className="empty-action">
          <Btn icon="close" onClick={reset}>Réinitialiser les filtres</Btn>
        </div>
      )}
      {!loading && !error && !rows.length && (
        <div className="empty-action">
          <Btn icon="plus" solid onClick={() => actions.staff()}>Ajouter un membre</Btn>
        </div>
      )}
    </>
  );
}
