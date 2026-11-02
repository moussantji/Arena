import React, { useEffect, useMemo, useState } from 'react';
import {
  Avatar, Btn, Card, CardHead, Icon, Pill, Progress, Table, Tr, Tabs,
} from '../ui.jsx';
import {
  useApi, useData, number, money, date, fullName, initials, EVALUATIONS,
} from '../data.jsx';
import { useActions } from '../actions.jsx';
import { errorMessage } from '../api.js';
import {
  buildExamGroups, exportLatestExamWorkbook, fetchLatestExamGrades,
} from '../exports.js';
import {
  ActionMenu, ListState, SelectFilter,
} from '../forms.jsx';
import {
  PageHead, StudentCell, StatusPill, average,
} from './common.jsx';
import { WeekGrid } from './timetable-grid.jsx';
import { dayIndex, schoolWeekStart, weekRangeLabel } from '../week.js';

const normalizeScore = (grade) => (
  (Number(grade.score) / Math.max(1, Number(grade.max_score || 20))) * 20
);

const tabs = ['Élèves', 'Matières', 'Emploi du temps', 'Dernier examen'];

export function FicheClasse() {
  const {
    meta, classId, setClassId, setStudentId, notify,
  } = useData();
  const actions = useActions();
  const [tab, setTab] = useState(0);
  const [exporting, setExporting] = useState(false);
  const classes = meta?.classes || [];
  const currency = meta?.school?.currency || 'FCFA';

  useEffect(() => {
    if (!classId && classes.length) setClassId(classes[0].id);
  }, [classId, classes.length, setClassId]);

  const summary = classes.find((item) => Number(item.id) === Number(classId));
  const detail = useApi(classId ? `/classes/${classId}` : null, undefined, { enabled: Boolean(classId) });
  const studentsApi = useApi(classId ? '/students' : null, {
    class_id: classId || undefined,
    per_page: 500,
  }, { enabled: Boolean(classId) });
  const gradesApi = useApi(classId ? '/grades' : null, {
    class_id: classId || undefined,
    latest_exam: 1,
    per_page: 1000,
  }, { enabled: Boolean(classId) });

  const classInfo = detail.data?.class || summary;
  const students = studentsApi.data?.data || classInfo?.students || [];
  const classSubjects = classInfo?.class_subjects || [];
  const slots = classInfo?.timetable_slots || [];
  const examGrades = gradesApi.data?.data || [];
  const exam = gradesApi.data?.latest_exam;
  const examGroup = useMemo(() => buildExamGroups(examGrades)[0], [examGrades]);

  const capacity = Number(classInfo?.capacity || 0);
  const fill = capacity ? Math.round((students.length / capacity) * 100) : 0;
  const hoursBySubject = new Map();
  slots.forEach((slot) => {
    const [sh, sm] = String(slot.starts_at || '0:0').split(':').map(Number);
    const [eh, em] = String(slot.ends_at || '0:0').split(':').map(Number);
    const hours = Math.max(0, (eh * 60 + em - sh * 60 - sm)) / 60;
    hoursBySubject.set(slot.subject_id, (hoursBySubject.get(slot.subject_id) || 0) + hours);
  });
  const weeklyHours = [...hoursBySubject.values()].reduce((sum, value) => sum + value, 0);
  const today = dayIndex(new Date());
  const weekStart = schoolWeekStart(new Date());
  const weekLabel = weekRangeLabel(weekStart);

  const openStudent = (student) => {
    if (!student?.id) return;
    setStudentId(student.id);
    window.location.hash = 'fiche';
  };

  const goTimetable = () => {
    if (classId) setClassId(classId);
    window.location.hash = 'emploi-du-temps';
  };

  const exportExam = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      let rows = examGrades;
      let info = exam;
      if (!rows.length && classId) {
        const result = await fetchLatestExamGrades(classId);
        rows = result.grades;
        info = result.exam;
      }
      if (!rows.length) {
        notify('Aucune note enregistrée pour le dernier examen de cette classe.', { tone: 'danger' });
        return;
      }
      await exportLatestExamWorkbook(rows, info, { schoolName: meta?.school?.name });
      notify(`Notes du dernier examen exportées : ${number(rows.length)} note${rows.length > 1 ? 's' : ''}.`, { tone: 'success' });
    } catch (exportError) {
      notify(errorMessage(exportError, 'Export impossible.'), { tone: 'danger' });
    } finally {
      setExporting(false);
    }
  };

  if (!classId) {
    return (
      <>
        <PageHead id="classe" sub="Sélectionnez une classe pour ouvrir sa fiche" secondary={null} primary={null} />
        <div className="state-box state-empty">
          <span className="state-ic"><Icon name="classes" size={18} /></span>
          <b>Aucune classe sélectionnée</b>
          <span>Choisissez une classe dans la liste pour afficher ses élèves, ses matières et son emploi du temps.</span>
          <div className="state-actions">
            <Btn icon="classes" onClick={() => { window.location.hash = 'classes'; }}>Parcourir les classes</Btn>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHead
        id="classe"
        sub={classInfo
          ? `${classInfo.name} · ${classInfo.level || '—'} · ${number(students.length)} élève${students.length > 1 ? 's' : ''} · ${classSubjects.length} matière${classSubjects.length > 1 ? 's' : ''}`
          : 'Chargement de la classe…'}
        onPrimary={() => classInfo && actions.classRoom(classInfo)}
        onSecondary={exportExam}
      />

      <div className="toolbar rise">
        <div className="toolbar-group">
          <Btn icon="chevronL" onClick={() => { window.location.hash = 'classes'; }}>Toutes les classes</Btn>
          <SelectFilter
            label="Classe"
            value={classId || ''}
            onChange={(value) => { setClassId(Number(value) || null); setTab(0); }}
            options={classes.map((item) => ({ value: item.id, label: item.name }))}
          />
        </div>
        <div className="toolbar-right">
          <Btn icon="calendar" onClick={goTimetable}>Emploi du temps</Btn>
          <Btn icon="grades" onClick={() => actions.grade(null, { school_class_id: classId })}>Saisir une note</Btn>
          <Btn icon="students" onClick={() => { setClassId(classId); window.location.hash = 'eleves'; }}>Voir les élèves</Btn>
        </div>
      </div>

      <ListState
        loading={detail.loading && !classInfo}
        error={detail.error}
        empty={!detail.loading && !detail.error && !classInfo}
        emptyTitle="Classe introuvable"
        emptySub="Cette classe n’existe plus ou a été retirée."
        onRetry={detail.reload}
      >
        {classInfo && (
          <>
            <Card className="profile-head rise" pad={false}>
              <Avatar initials={initials(classInfo.name)} size={64} tone="muted" />
              <div className="ph-main">
                <h2>{classInfo.name}</h2>
                <span>{classInfo.level || '—'} · {classInfo.room || 'Salle —'} · {students.length} élèves</span>
                <div className="ph-chips">
                  <Pill tone={classInfo.is_active ? 'accent' : 'muted'}>{classInfo.is_active ? 'Classe active' : 'Classe fermée'}</Pill>
                  <Pill tone="glass">{classSubjects.length} matières</Pill>
                  <Pill tone="muted">Capacité {capacity || '—'}</Pill>
                  {classInfo.head_teacher && <Pill tone="copper">PP · {fullName(classInfo.head_teacher)}</Pill>}
                </div>
              </div>
              <div className="ph-actions">
                <Btn icon="edit" onClick={() => actions.classRoom(classInfo)}>Modifier</Btn>
                <Btn icon="download" solid onClick={exportExam}>Exporter les notes</Btn>
              </div>
            </Card>

            <div className="stats-row rise">
              <div className="stat"><b>{students.length}</b><span>Élèves inscrits</span></div>
              <div className="stat"><b>{classSubjects.length}</b><span>Matières suivies</span></div>
              <div className="stat"><b className="tone-accent">{number(weeklyHours, 1)} h</b><span>Volume hebdomadaire</span></div>
              <div className="stat"><b>{examGroup?.classAverage != null ? number(examGroup.classAverage, 2) : '—'}</b><span>Moyenne dernier examen</span></div>
            </div>

            <div className="toolbar rise">
              <Tabs items={tabs} active={tab} onChange={setTab} />
              <div className="toolbar-right">
                <span className="toolbar-count">{students.length} / {capacity || '—'} places · {fill} % d’occupation</span>
              </div>
            </div>

            {tab === 0 && (
              <Card className="rise" style={{ animationDelay: '80ms' }}>
                <CardHead
                  title="Élèves de la classe"
                  sub={`${students.length} élève${students.length > 1 ? 's' : ''} · cliquer sur une ligne pour ouvrir la fiche`}
                  right={<Pill tone="accent">{number(students.length)}</Pill>}
                />
                {students.length ? (
                  <Table
                    columns={['Élève', 'Matricule', 'Statut', 'Moyenne', 'Solde', '']}
                    template="1.8fr .8fr .9fr .7fr 1fr 34px"
                    foot={<span className="tf-l">{students.length} élèves · capacité {capacity || '—'}</span>}
                  >
                    {students.map((student) => (
                      <Tr
                        key={student.id}
                        template="1.8fr .8fr .9fr .7fr 1fr 34px"
                        onClick={() => openStudent(student)}
                        title={`Ouvrir la fiche de ${fullName(student)}`}
                      >
                        <StudentCell student={student} sub={student.school_class?.name || classInfo.name} />
                        <span className="cell mono">{student.matricule || '—'}</span>
                        <span className="cell"><StatusPill status={student.status} /></span>
                        <span className="cell mono">{average(student.average)}</span>
                        <span className={`cell mono right ${Number(student.balance) > 0 ? 'is-debt' : ''}`}>{money(student.balance ?? 0, currency)}</span>
                        <span className="cell right cell-actions" onClick={(event) => event.stopPropagation()}>
                          <ActionMenu actions={[
                            { label: 'Ouvrir la fiche', icon: 'external', onClick: () => openStudent(student) },
                            { label: 'Aperçu rapide', icon: 'profile', onClick: () => actions.studentDrawer(student) },
                            { label: 'Modifier le dossier', icon: 'edit', onClick: () => actions.student(student) },
                            { label: 'Créer une facture', icon: 'finance', onClick: () => actions.invoice(null, { student_id: student.id }) },
                          ]} />
                        </span>
                      </Tr>
                    ))}
                  </Table>
                ) : <div className="state-inline">Aucun élève inscrit dans cette classe.</div>}
              </Card>
            )}

            {tab === 1 && (
              <Card className="rise" style={{ animationDelay: '80ms' }}>
                <CardHead
                  title="Matières et enseignants"
                  sub={`${classSubjects.length} matière${classSubjects.length > 1 ? 's' : ''} · ${number(weeklyHours, 1)} h / semaine`}
                />
                {classSubjects.length ? (
                  <Table
                    columns={['Matière', 'Code', 'Enseignant', 'Coef.', 'Heures / semaine']}
                    template="1.8fr .7fr 1.5fr .6fr 1fr"
                    foot={<span className="tf-l">{number(weeklyHours, 1)} heures hebdomadaires</span>}
                  >
                    {classSubjects.map((item) => (
                      <Tr key={item.id} template="1.8fr .7fr 1.5fr .6fr 1fr">
                        <span className="cell"><b className="cell-title">{item.subject?.name || '—'}</b></span>
                        <span className="cell mono">{item.subject?.code || '—'}</span>
                        <span className="cell">{item.staff ? fullName(item.staff) : 'Non affecté'}</span>
                        <span className="cell mono">{number(item.subject?.coefficient ?? 0, 0)}</span>
                        <span className="cell mono">{number(hoursBySubject.get(item.subject_id) || 0, 1)} h</span>
                      </Tr>
                    ))}
                  </Table>
                ) : <div className="state-inline">Aucune matière affectée à cette classe.</div>}
              </Card>
            )}

            {tab === 2 && (
              <Card className="rise timetable-card" pad={false} style={{ animationDelay: '80ms' }}>
                <div className="class-tab-head">
                  <CardHead
                    title="Emploi du temps"
                    sub={`Semaine ${weekLabel} · ${slots.length} cours · ${number(weeklyHours, 1)} h / semaine`}
                    right={<Btn icon="calendar" onClick={goTimetable}>Ouvrir la page complète</Btn>}
                  />
                </div>
                <WeekGrid
                  slots={slots}
                  weekStart={weekStart}
                  today={today}
                  now={new Date()}
                  onSlot={(slot) => actions.slot(slot)}
                  onAdd={(day, hour) => actions.slot(null, {
                    school_class_id: classId,
                    day_of_week: day,
                    starts_at: hour,
                    ends_at: hour ? `${String(Math.min(23, Number(hour.slice(0, 2)) + 2)).padStart(2, '0')}:${hour.slice(3, 5)}` : '',
                    term_id: meta?.term?.id,
                  })}
                  onDelete={(slot) => actions.deleteSlot(slot)}
                />
              </Card>
            )}

            {tab === 3 && (
              <Card className="rise" style={{ animationDelay: '80ms' }}>
                <CardHead
                  title={exam ? `Dernier examen · ${EVALUATIONS[exam.evaluation] || exam.evaluation}` : 'Dernier examen'}
                  sub={exam ? `${date(exam.date)}${exam.term ? ` · ${exam.term}` : ''} · ${examGrades.length} notes` : 'Aucune évaluation enregistrée'}
                  right={examGroup?.classAverage != null ? <Pill tone="accent">Moyenne {number(examGroup.classAverage, 2)} / 20</Pill> : null}
                />
                {examGroup?.subjects?.length ? (
                  <Table
                    columns={['Matricule', 'Élève', ...examGroup.subjects.map((subject) => subject.name), 'Moyenne', 'Rang']}
                    template={`0.7fr 1.6fr ${examGroup.subjects.map(() => '.8fr').join(' ')} .8fr .5fr`}
                    foot={(
                      <>
                        <span className="tf-l">{examGroup.students.length} élèves · {examGroup.successRate} % ont la moyenne</span>
                        <span className="tf-r">Moyenne de classe : {number(examGroup.classAverage ?? 0, 2)} / 20</span>
                      </>
                    )}
                  >
                    {examGroup.students.map((entry) => (
                      <Tr
                        key={entry.id}
                        template={`0.7fr 1.6fr ${examGroup.subjects.map(() => '.8fr').join(' ')} .8fr .5fr`}
                        onClick={() => openStudent(entry.student)}
                        title={`Ouvrir la fiche de ${fullName(entry.student)}`}
                      >
                        <span className="cell mono">{entry.student?.matricule || '—'}</span>
                        <span className="cell">{fullName(entry.student)}</span>
                        {examGroup.subjects.map((subject) => {
                          const grade = entry.grades.get(subject.id);
                          return (
                            <span key={subject.id} className={`cell mono ${grade && normalizeScore(grade) < 10 ? 'is-debt' : ''}`}>
                              {grade ? number(normalizeScore(grade), 2) : '—'}
                            </span>
                          );
                        })}
                        <span className="cell mono"><b>{entry.average != null ? number(entry.average, 2) : '—'}</b></span>
                        <span className="cell mono">{entry.rank ?? '—'}</span>
                      </Tr>
                    ))}
                  </Table>
                ) : <div className="state-inline">Aucune note pour le dernier examen de cette classe.</div>}
              </Card>
            )}
          </>
        )}
      </ListState>
    </>
  );
}
