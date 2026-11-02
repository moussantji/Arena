import React, { useEffect, useMemo, useState } from 'react';
import {
  Avatar, Btn, Card, CardHead, Icon, Pill, Table, Tr, Tabs,
} from '../ui.jsx';
import {
  useApi, useData, number, date, fullName, initials,
} from '../data.jsx';
import { useActions } from '../actions.jsx';
import { errorMessage } from '../api.js';
import { exportStaffProfileWorkbook } from '../exports.js';
import { ListState } from '../forms.jsx';
import { PageHead } from './common.jsx';
import { WeekGrid, slotDuration } from './timetable-grid.jsx';
import { dayIndex, schoolWeekStart, weekRangeLabel } from '../week.js';

/* ============================================================
   DIALLO — fiche personnel
   Identité, contrat, enseignements et emploi du temps du membre.
   ============================================================ */

const tabs = ['Profil', 'Enseignements', 'Emploi du temps'];

export function FichePersonnel() {
  const {
    meta, staffId, setStaffId, setClassId, notify,
  } = useData();
  const actions = useActions();
  const [tab, setTab] = useState(0);
  const [exporting, setExporting] = useState(false);
  const roster = meta?.staff || [];

  useEffect(() => {
    if (!staffId && roster.length) setStaffId(roster[0].id);
  }, [staffId, roster.length, setStaffId]);

  const detail = useApi(staffId ? `/staff/${staffId}` : null, undefined, { enabled: Boolean(staffId) });
  const member = detail.data?.staff;
  const classSubjects = member?.class_subjects || [];
  const slots = member?.timetable_slots || [];
  const headClasses = member?.head_teacher_classes || [];
  const weekStart = schoolWeekStart(new Date());
  const weekLabel = weekRangeLabel(weekStart);

  const hoursByAssignment = useMemo(() => {
    const map = new Map();
    slots.forEach((slot) => {
      const key = `${slot.school_class_id}:${slot.subject_id}`;
      map.set(key, (map.get(key) || 0) + slotDuration(slot));
    });
    return map;
  }, [slots]);

  const weeklyHours = slots.reduce((sum, slot) => sum + slotDuration(slot), 0);
  const classesCount = new Set([
    ...classSubjects.map((item) => item.school_class_id),
    ...headClasses.map((item) => item.id),
  ].filter(Boolean)).size;

  const goBack = () => { window.location.hash = 'personnel'; };

  const openClass = (id) => {
    if (!id) return;
    setClassId(id);
    window.location.hash = 'classe';
  };

  const exportProfile = async () => {
    if (!member || exporting) return;
    setExporting(true);
    try {
      await exportStaffProfileWorkbook(member, {
        schoolName: meta?.school?.name,
        termName: meta?.term?.name,
        yearName: meta?.academic_year?.label,
      });
      notify(`Fiche de ${fullName(member)} exportée.`, { tone: 'success' });
    } catch (error) {
      notify(errorMessage(error, 'Export impossible.'), { tone: 'danger' });
    } finally {
      setExporting(false);
    }
  };

  if (!staffId) {
    return (
      <>
        <PageHead id="fiche-personnel" sub="Sélectionnez un membre de l’équipe pour ouvrir sa fiche" secondary={null} primary={null} />
        <div className="state-box state-empty">
          <span className="state-ic"><Icon name="staff" size={18} /></span>
          <b>Aucun membre sélectionné</b>
          <span>Choisissez un membre dans la liste pour afficher son dossier, ses cours et son emploi du temps.</span>
          <div className="state-actions">
            <Btn icon="staff" onClick={goBack}>Parcourir le personnel</Btn>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHead
        id="fiche-personnel"
        sub={member
          ? `${fullName(member)} · ${member.role} · ${member.department?.name || 'sans département'}`
          : 'Chargement de la fiche…'}
        onPrimary={() => member && actions.staff(member)}
        onSecondary={exportProfile}
      />

      <div className="toolbar rise">
        <div className="toolbar-group">
          <Btn icon="chevronL" onClick={goBack}>Tout le personnel</Btn>
          <span className="toolbar-count">
            {roster.length} membre{roster.length > 1 ? 's' : ''} dans l’équipe
          </span>
        </div>
        <div className="toolbar-right">
          {member && <Btn icon="upload" onClick={() => actions.photo(member, { kind: 'staff' })}>Changer la photo</Btn>}
          {member && <Btn icon="edit" onClick={() => actions.staff(member)}>Modifier</Btn>}
        </div>
      </div>

      <ListState
        loading={detail.loading && !member}
        error={detail.error}
        empty={!detail.loading && !detail.error && !member}
        emptyTitle="Membre introuvable"
        emptySub="Ce membre n’existe plus ou a été retiré de l’équipe."
        onRetry={detail.reload}
      >
        {member && (
          <>
            <Card className="profile-head rise" pad={false}>
              <Avatar
                initials={member.initials || initials(fullName(member))}
                size={64}
                src={member.photo_url}
                tone={member.is_active ? 'accent' : 'muted'}
              />
              <div className="ph-main">
                <h2>{fullName(member)}</h2>
                <span>{member.role} · {member.department?.name || 'Sans département'} · {member.email || 'sans e-mail'}</span>
                <div className="ph-chips">
                  <Pill tone={member.is_active ? 'accent' : 'danger'}>{member.is_active ? 'En poste' : 'Inactif'}</Pill>
                  <Pill tone="muted">{member.years_experience || 0} ans d’expérience</Pill>
                  <Pill tone="glass">{classSubjects.length} enseignement{classSubjects.length > 1 ? 's' : ''}</Pill>
                  {headClasses.length > 0 && <Pill tone="copper">PP · {headClasses.map((item) => item.name).join(', ')}</Pill>}
                </div>
              </div>
              <div className="ph-actions">
                <Btn icon="download" onClick={exportProfile}>Exporter la fiche</Btn>
                <Btn icon="messages" onClick={() => actions.thread()}>Message</Btn>
                <Btn icon="edit" solid onClick={() => actions.staff(member)}>Modifier</Btn>
              </div>
            </Card>

            <div className="stats-row rise">
              <div className="stat"><b>{classSubjects.length}</b><span>Cours affectés</span></div>
              <div className="stat"><b className="tone-accent">{classesCount}</b><span>Classes suivies</span></div>
              <div className="stat"><b>{number(weeklyHours, 1)} h</b><span>Volume hebdomadaire</span></div>
              <div className="stat"><b>{member.years_experience || 0} ans</b><span>Ancienneté métier</span></div>
            </div>

            <div className="toolbar rise">
              <Tabs items={tabs} active={tab} onChange={setTab} />
              <div className="toolbar-right">
                <span className="toolbar-count">
                  Embauché le {date(member.hired_on)}
                </span>
              </div>
            </div>

            {tab === 0 && (
              <div className="grid-main">
                <Card className="rise" style={{ animationDelay: '80ms' }}>
                  <CardHead title="Identité et contrat" sub="Informations administratives" />
                  <dl className="dl">
                    <div><dt>Nom complet</dt><dd>{fullName(member)}</dd></div>
                    <div><dt>Fonction</dt><dd>{member.role || '—'}</dd></div>
                    <div><dt>Département</dt><dd>{member.department?.name || '—'}</dd></div>
                    <div><dt>E-mail</dt><dd>{member.email || '—'}</dd></div>
                    <div><dt>Téléphone</dt><dd className="mono">{member.phone || '—'}</dd></div>
                    <div><dt>Date d’embauche</dt><dd>{date(member.hired_on)}</dd></div>
                    <div><dt>Expérience</dt><dd>{member.years_experience || 0} an{(member.years_experience || 0) > 1 ? 's' : ''}</dd></div>
                    <div><dt>Statut</dt><dd>{member.is_active ? 'En poste' : 'Inactif'}</dd></div>
                  </dl>
                </Card>

                <div className="stack">
                  <Card className="rise" style={{ animationDelay: '130ms' }}>
                    <CardHead title="Classes principales" sub={`${headClasses.length} classe${headClasses.length > 1 ? 's' : ''} dont il/elle est professeur principal`} />
                    {headClasses.length ? (
                      <ul className="task-list">
                        {headClasses.map((item) => (
                          <li key={item.id}>
                            <span className="task-date mono">{item.level || '—'}</span>
                            <span className="task-main">
                              <b>{item.name}</b>
                              <em>Salle {item.room || '—'}</em>
                            </span>
                            <button type="button" className="icon-btn" title="Ouvrir la classe" onClick={() => openClass(item.id)}>
                              <Icon name="external" size={13} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : <div className="state-inline">Aucune classe principale.</div>}
                  </Card>

                  <Card className="rise" style={{ animationDelay: '180ms' }}>
                    <CardHead title="Contact rapide" sub="Coordonnées professionnelles" />
                    <dl className="dl">
                      <div><dt>E-mail</dt><dd>{member.email || '—'}</dd></div>
                      <div><dt>Téléphone</dt><dd className="mono">{member.phone || '—'}</dd></div>
                      <div><dt>Département</dt><dd>{member.department?.code || '—'}</dd></div>
                    </dl>
                  </Card>
                </div>
              </div>
            )}

            {tab === 1 && (
              <Card className="rise" style={{ animationDelay: '80ms' }}>
                <CardHead
                  title="Enseignements"
                  sub={`${classSubjects.length} affectation${classSubjects.length > 1 ? 's' : ''} · ${number(weeklyHours, 1)} h / semaine`}
                  right={<Pill tone="accent">{number(weeklyHours, 1)} h</Pill>}
                />
                {classSubjects.length ? (
                  <Table
                    columns={['Classe', 'Matière', 'Code', 'Heures / semaine', 'Salle', '']}
                    template="1.3fr 1.6fr .6fr 1fr .7fr 34px"
                    foot={<span className="tf-l">{classSubjects.length} cours · {classesCount} classes</span>}
                  >
                    {classSubjects.map((item) => {
                      const hours = hoursByAssignment.get(`${item.school_class_id}:${item.subject_id}`) || 0;
                      return (
                        <Tr
                          key={item.id}
                          template="1.3fr 1.6fr .6fr 1fr .7fr 34px"
                          onClick={() => openClass(item.school_class_id)}
                          title={`Ouvrir la fiche de ${item.school_class?.name || 'la classe'}`}
                        >
                          <span className="cell"><b className="cell-title">{item.school_class?.name || '—'}</b><em className="cell-sub">{item.school_class?.level || ''}</em></span>
                          <span className="cell">{item.subject?.name || '—'}</span>
                          <span className="cell mono">{item.subject?.code || '—'}</span>
                          <span className="cell mono">{number(hours, 1)} h</span>
                          <span className="cell mono">{item.school_class?.room || '—'}</span>
                          <span className="cell right cell-actions" onClick={(event) => event.stopPropagation()}>
                            <Btn icon="external" onClick={() => openClass(item.school_class_id)}>Classe</Btn>
                          </span>
                        </Tr>
                      );
                    })}
                  </Table>
                ) : <div className="state-inline">Aucun enseignement affecté à ce membre.</div>}
              </Card>
            )}

            {tab === 2 && (
              <Card className="rise timetable-card" pad={false} style={{ animationDelay: '80ms' }}>
                <div className="class-tab-head">
                  <CardHead
                    title="Emploi du temps"
                    sub={`Semaine ${weekLabel} · ${slots.length} cours · ${number(weeklyHours, 1)} h / semaine`}
                    right={<Pill tone="accent">{classesCount} classes</Pill>}
                  />
                </div>
                <WeekGrid
                  slots={slots}
                  weekStart={weekStart}
                  today={dayIndex(new Date())}
                  now={new Date()}
                  readOnly
                />
              </Card>
            )}
          </>
        )}
      </ListState>
    </>
  );
}
