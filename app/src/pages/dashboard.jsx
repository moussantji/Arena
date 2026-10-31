import React from 'react';
import {
  Avatar, Btn, Card, CardHead, Kpi, Pill, Progress, Table, Tr, AreaChart, HBarList,
} from '../ui.jsx';
import {
  useApi, useData, number, compactMoney, date, time, initials,
} from '../data.jsx';
import { useActions } from '../actions.jsx';
import { ActionMenu } from '../forms.jsx';
import { exportDashboardReport } from '../reports.js';
import { PageHead, StudentCell, StatusPill } from './common.jsx';

export function Dashboard() {
  const { meta, setStudentId } = useData();
  const actions = useActions();
  const { data, loading, error, reload } = useApi('/dashboard');
  const kpis = data?.kpis || {};
  const recent = data?.recent_students || [];
  const series = (data?.recovery_series || []).map((row) => ({ m: row.label, v: row.total / 1_000_000 }));
  const today = data?.today || [];
  const currency = meta?.school?.currency || 'FCFA';
  const distribution = data?.class_distribution || [];
  const now = new Date();
  const dayProgress = Math.max(0, Math.min(100, ((now.getHours() - 7) * 60 + now.getMinutes()) / (10 * 60) * 100));

  const exportDashboard = () => exportDashboardReport({
    meta, data, currency,
  });

  const kpiItems = [
    {
      key: 'students',
      label: 'Élèves',
      value: number(kpis.students),
      delta: `${meta?.counts?.classes ?? distribution.length} classes`,
      hint: 'inscrits et actifs',
      tone: 'up',
    },
    {
      key: 'attendance',
      label: 'Présence',
      value: `${number(kpis.attendance, 1)} %`,
      progress: kpis.attendance || 0,
      hint: 'moyenne ce mois',
    },
    {
      key: 'recovery',
      label: 'Recouvrement',
      value: number((kpis.recovery || 0) / 1_000_000, 2),
      unit: `M ${currency}`,
      spark: series.slice(-10).map((row) => row.v),
      hint: 'encaissements de l’année',
    },
    {
      key: 'classes',
      label: 'Classes',
      value: number(kpis.classes ?? meta?.counts?.classes),
      hint: `${number(meta?.counts?.students)} élèves au total`,
      dot: true,
    },
  ];

  if (!data && loading) {
    return (
      <>
        <PageHead id="dashboard" sub="Chargement de la vue d’ensemble…" />
        <div className="state-box state-loading"><span className="spinner large" /><b>Chargement du tableau de bord…</b></div>
      </>
    );
  }

  if (!data && error) {
    return (
      <>
        <PageHead id="dashboard" sub="API indisponible" />
        <div className="state-box state-error">
          <b>Impossible de charger le tableau de bord</b>
          <span>{String(error.message || error)}</span>
          <Btn icon="refresh" onClick={reload}>Réessayer</Btn>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHead
        id="dashboard"
        sub={`${meta?.school?.full_name || 'École Internationale Diallo'} · ${meta?.term?.name || 'Semestre 1'}`}
        secondary="Rapport PDF"
        onPrimary={() => actions.student()}
        onSecondary={exportDashboard}
      />

      <div className="kpis">
        {kpiItems.map((item, index) => <Kpi key={item.key} item={item} index={index} />)}
      </div>

      <div className="grid-main">
        <Card className="rise" style={{ animationDelay: '120ms' }}>
          <CardHead
            title="Recouvrement mensuel"
            sub={`Exercice ${new Date().getFullYear()} · en millions de ${currency}`}
          />
          {series.length ? <AreaChart data={series} /> : <div className="state-inline">Aucun encaissement enregistré.</div>}
        </Card>

        <Card className="rise" style={{ animationDelay: '180ms' }}>
          <CardHead
            title="Aujourd’hui"
            sub={`${today.length} cours programmé${today.length > 1 ? 's' : ''}`}
            right={<Pill tone="accent" dot>En cours</Pill>}
          />
          <ul className="today">
            {today.slice(0, 4).map((slot) => (
              <li key={slot.id}>
                <Avatar initials={slot.staff?.initials || initials(fullName(slot.staff))} tone={slot.is_live ? 'accent' : 'muted'} size={30} src={slot.staff?.photo_url} />
                <span className="today-main">
                  <b>{slot.subject?.name || 'Cours'}</b>
                  <em>{slot.school_class?.name} · {slot.room || slot.school_class?.room || '—'}</em>
                </span>
                <span className="today-time">{time(slot.starts_at)}</span>
              </li>
            ))}
            {!today.length && <li className="today-empty">Aucun cours aujourd’hui.</li>}
          </ul>
          <div className="today-foot">
            <Progress value={dayProgress} height={3} />
            <span>{Math.round(dayProgress)} % de la journée</span>
          </div>
        </Card>
      </div>

      <div className="grid-main">
        <Card className="rise" style={{ animationDelay: '240ms' }}>
          <CardHead
            title="Élèves récents"
            sub={`${number(kpis.students)} élèves inscrits`}
            right={<Btn icon="external" onClick={() => { window.location.hash = 'eleves'; }}>Tout voir</Btn>}
          />
          <Table
            columns={['Élève', 'Classe', 'Statut', 'Inscrit le', '']}
            template="1.7fr .9fr .9fr .9fr 34px"
            foot={<><span className="tf-l">{recent.length} derniers dossiers</span><span className="tf-r">API live</span></>}
          >
            {recent.map((student) => (
              <Tr key={student.id} template="1.7fr .9fr .9fr .9fr 34px">
                <StudentCell student={student} sub={`${student.matricule} · ${student.school_class?.name || 'Sans classe'}`} />
                <span className="cell">{student.school_class?.name || '—'}</span>
                <span className="cell"><StatusPill status={student.status} /></span>
                <span className="cell mono">{date(student.created_at)}</span>
                <span className="cell right cell-actions">
                  <ActionMenu actions={[
                    {
                      label: 'Voir la fiche',
                      icon: 'profile',
                      onClick: () => {
                        setStudentId(student.id);
                        window.location.hash = 'fiche';
                      },
                    },
                    { label: 'Modifier', icon: 'edit', onClick: () => actions.student(student) },
                    {
                      label: 'Ouvrir la fiche',
                      icon: 'external',
                      onClick: () => {
                        setStudentId(student.id);
                        window.location.hash = 'fiche';
                      },
                    },
                    { label: 'Supprimer', icon: 'trash', tone: 'danger', onClick: () => actions.deleteStudent(student) },
                  ]} />
                </span>
              </Tr>
            ))}
          </Table>
        </Card>

        <Card className="rise" style={{ animationDelay: '300ms' }}>
          <CardHead title="Répartition" sub="Effectifs par niveau" right={<Pill tone="muted">{meta?.classes?.length || 0} classes</Pill>} />
          {distribution.length ? (
            <HBarList items={distribution.map((row) => ({ label: row.label, v: row.value, display: number(row.value) }))} />
          ) : (
            <div className="state-inline">Aucune classe enregistrée.</div>
          )}
          <div className="mini-actions">
            <Btn icon="classes" onClick={() => { window.location.hash = 'classes'; }}>Gérer les classes</Btn>
          </div>
        </Card>
      </div>
    </>
  );
}
