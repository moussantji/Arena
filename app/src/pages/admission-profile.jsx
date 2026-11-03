import React, { useMemo, useState } from 'react';
import {
  Avatar, Btn, Card, CardHead, Icon, Pill,
} from '../ui.jsx';
import {
  useApi, useData, date, fullName, initials, ADMISSION_STATUS,
} from '../data.jsx';
import { useActions } from '../actions.jsx';
import { api, errorMessage } from '../api.js';
import { exportAdmissionWorkbook } from '../exports.js';
import { ListState } from '../forms.jsx';
import { PageHead, AdmissionPill } from './common.jsx';

/* ============================================================
   Kalanso — fiche admission
   Dossier complet du candidat, parcours et décisions.
   ============================================================ */

const COLUMNS = ['nouveau', 'entretien', 'valide', 'inscrit', 'refuse'];
const NEXT_STEP = {
  nouveau: ['entretien', 'valide', 'refuse'],
  entretien: ['valide', 'refuse'],
  valide: ['inscrit', 'refuse'],
  inscrit: [],
  refuse: ['nouveau'],
};

const ageOf = (value) => {
  if (!value) return null;
  const birth = new Date(value);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const month = now.getMonth() - birth.getMonth();
  if (month < 0 || (month === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age >= 0 ? age : null;
};

export function FicheAdmission() {
  const {
    meta, admissionId, setAdmissionId, refresh, notify,
  } = useData();
  const actions = useActions();
  const [exporting, setExporting] = useState(false);
  const detail = useApi(admissionId ? `/admissions/${admissionId}` : null, undefined, { enabled: Boolean(admissionId) });
  const admission = detail.data?.admission;
  const status = ADMISSION_STATUS[admission?.status] || { label: admission?.status || '—', tone: 'muted' };
  const stepIndex = COLUMNS.indexOf(admission?.status);
  const age = ageOf(admission?.birth_date);

  const goBack = () => { window.location.hash = 'admissions'; };

  const move = async (nextStatus) => {
    if (!admission) return;
    try {
      await api.patch(`/admissions/${admission.id}`, { status: nextStatus });
      notify(`${fullName(admission)} · ${ADMISSION_STATUS[nextStatus]?.label || nextStatus}.`);
      detail.reload();
      refresh();
    } catch (error) {
      notify(errorMessage(error, 'Impossible de déplacer ce dossier.'), { tone: 'danger' });
    }
  };

  const exportDossier = async () => {
    if (!admission || exporting) return;
    setExporting(true);
    try {
      await exportAdmissionWorkbook(admission, {
        schoolName: meta?.school?.name,
        termName: meta?.term?.name,
        yearName: meta?.academic_year?.label,
      });
      notify(`Dossier de ${fullName(admission)} exporté.`, { tone: 'success' });
    } catch (error) {
      notify(errorMessage(error, 'Export impossible.'), { tone: 'danger' });
    } finally {
      setExporting(false);
    }
  };

  const actionsFor = useMemo(() => {
    if (!admission) return [];
    return [
      { label: 'Modifier le dossier', icon: 'edit', onClick: () => actions.admission(admission) },
      ...(NEXT_STEP[admission.status] || []).map((nextStatus) => ({
        label: `Marquer « ${ADMISSION_STATUS[nextStatus]?.label || nextStatus} »`,
        icon: nextStatus === 'refuse' ? 'close' : 'check',
        onClick: () => move(nextStatus),
      })),
      admission.status !== 'inscrit' && {
        label: 'Inscrire dans la classe',
        icon: 'userPlus',
        onClick: () => actions.enrollAdmission(admission),
      },
      { label: 'Supprimer', icon: 'trash', tone: 'danger', onClick: () => actions.deleteAdmission(admission) },
    ].filter(Boolean);
  }, [admission, actions]);

  if (!admissionId) {
    return (
      <>
        <PageHead id="fiche-admission" sub="Sélectionnez un dossier pour afficher la fiche candidat" secondary={null} primary={null} />
        <div className="state-box state-empty">
          <span className="state-ic"><Icon name="admissions" size={18} /></span>
          <b>Aucun dossier sélectionné</b>
          <span>Choisissez une candidature dans le pipeline ou dans la liste pour ouvrir son dossier.</span>
          <div className="state-actions">
            <Btn icon="admissions" onClick={goBack}>Parcourir les admissions</Btn>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHead
        id="fiche-admission"
        sub={admission
          ? `${admission.reference} · ${fullName(admission)} · ${admission.desired_class?.name || 'classe à définir'}`
          : 'Chargement du dossier…'}
        onPrimary={() => admission && actions.admission(admission)}
        onSecondary={exportDossier}
      />

      <div className="toolbar rise">
        <div className="toolbar-group">
          <Btn icon="chevronL" onClick={goBack}>Toutes les admissions</Btn>
          {admission && <span className="toolbar-count">{admission.reference}</span>}
        </div>
        <div className="toolbar-right">
          {admission && <Btn icon="edit" onClick={() => actions.admission(admission)}>Modifier</Btn>}
          {admission && (
            <Btn icon="download" onClick={exportDossier}>Exporter le dossier</Btn>
          )}
        </div>
      </div>

      <ListState
        loading={detail.loading && !admission}
        error={detail.error}
        empty={!detail.loading && !detail.error && !admission}
        emptyTitle="Dossier introuvable"
        emptySub="Cette candidature n’existe plus ou a été retirée."
        onRetry={detail.reload}
      >
        {admission && (
          <>
            <Card className="profile-head rise" pad={false}>
              <Avatar
                initials={initials(fullName(admission))}
                size={64}
                tone={admission.status === 'refuse' ? 'muted' : 'accent'}
              />
              <div className="ph-main">
                <h2>{fullName(admission)}</h2>
                <span>
                  {admission.reference} · {admission.desired_class?.name || 'Classe à définir'}
                  {age != null ? ` · ${age} ans` : ''}
                </span>
                <div className="ph-chips">
                  <AdmissionPill status={admission.status} />
                  <Pill tone="muted">{admission.gender === 'F' ? 'Féminin' : admission.gender === 'M' ? 'Masculin' : 'Sexe non renseigné'}</Pill>
                  <Pill tone="glass">Candidature {date(admission.applied_on)}</Pill>
                  {admission.decision_on && <Pill tone="copper">Décision {date(admission.decision_on)}</Pill>}
                </div>
              </div>
              <div className="ph-actions">
                <Btn icon="download" onClick={exportDossier}>Exporter</Btn>
                <Btn icon="edit" onClick={() => actions.admission(admission)}>Modifier</Btn>
                <Btn icon="check" solid onClick={() => actions.enrollAdmission(admission)}>Inscrire</Btn>
              </div>
            </Card>

            <div className="stats-row rise">
              <div className="stat"><b>{admission.reference}</b><span>Référence du dossier</span></div>
              <div className="stat"><b className="tone-accent">{admission.desired_class?.name || '—'}</b><span>Classe demandée</span></div>
              <div className="stat"><b>{date(admission.applied_on)}</b><span>Candidature reçue</span></div>
              <div className="stat"><b>{admission.decision_on ? date(admission.decision_on) : '—'}</b><span>Date de décision</span></div>
            </div>

            <Card className="admission-steps rise" style={{ animationDelay: '50ms' }}>
              <CardHead title="Parcours du dossier" sub="Cliquez sur une étape pour faire avancer la candidature" />
              <div className="admission-step-list">
                {COLUMNS.map((step, index) => {
                  const entry = ADMISSION_STATUS[step];
                  const reached = stepIndex >= index && stepIndex >= 0;
                  const current = admission.status === step;
                  return (
                    <button
                      key={step}
                      type="button"
                      className={`admission-step${reached ? ' reached' : ''}${current ? ' current' : ''}`}
                      onClick={() => !current && step !== 'inscrit' && move(step)}
                      disabled={current || step === 'inscrit'}
                    >
                      <span className={`status-dot tone-${entry.tone}`} />
                      <b>{entry.label}</b>
                      <em>{current ? 'Étape actuelle' : reached ? 'Étape franchie' : 'À venir'}</em>
                    </button>
                  );
                })}
              </div>
            </Card>

            <div className="grid-main">
              <Card className="rise" style={{ animationDelay: '80ms' }}>
                <CardHead title="Dossier candidat" sub="Identité et scolarisation souhaitée" />
                <dl className="dl">
                  <div><dt>Nom complet</dt><dd>{fullName(admission)}</dd></div>
                  <div><dt>Sexe</dt><dd>{admission.gender === 'F' ? 'Féminin' : admission.gender === 'M' ? 'Masculin' : '—'}</dd></div>
                  <div><dt>Date de naissance</dt><dd>{date(admission.birth_date)}{age != null ? ` · ${age} ans` : ''}</dd></div>
                  <div><dt>Classe demandée</dt><dd>{admission.desired_class?.name || '—'}</dd></div>
                  <div><dt>Niveau</dt><dd>{admission.desired_class?.level || '—'}</dd></div>
                  <div><dt>Salle prévue</dt><dd>{admission.desired_class?.room || '—'}</dd></div>
                  <div><dt>Référence</dt><dd className="mono">{admission.reference}</dd></div>
                  <div><dt>Statut</dt><dd>{status.label}</dd></div>
                </dl>
              </Card>

              <div className="stack">
                <Card className="rise" style={{ animationDelay: '130ms' }}>
                  <CardHead title="Responsable légal" sub="Contact principal du dossier" />
                  <dl className="dl">
                    <div><dt>Nom</dt><dd>{admission.guardian_name || '—'}</dd></div>
                    <div><dt>Téléphone</dt><dd className="mono">{admission.guardian_phone || '—'}</dd></div>
                    <div><dt>E-mail</dt><dd>{admission.guardian_email || '—'}</dd></div>
                  </dl>
                </Card>

                <Card className="rise" style={{ animationDelay: '180ms' }}>
                  <CardHead title="Suivi" sub="Dates et décisions" />
                  <dl className="dl">
                    <div><dt>Candidature</dt><dd>{date(admission.applied_on)}</dd></div>
                    <div><dt>Décision</dt><dd>{admission.decision_on ? date(admission.decision_on) : 'En attente'}</dd></div>
                    <div><dt>Étape</dt><dd>{status.label}</dd></div>
                  </dl>
                  <div className="mini-actions">
                    {admission.status !== 'inscrit' && (
                      <Btn icon="userPlus" onClick={() => actions.enrollAdmission(admission)}>Inscrire l’élève</Btn>
                    )}
                    <Btn icon="edit" onClick={() => actions.admission(admission)}>Modifier</Btn>
                  </div>
                </Card>
              </div>
            </div>

            <Card className="rise" style={{ animationDelay: '220ms' }}>
              <CardHead title="Notes internes" sub="Éléments complémentaires du dossier" right={<Pill tone="muted">Confidentiel</Pill>} />
              {admission.notes
                ? <p className="mtext">{admission.notes}</p>
                : <div className="state-inline">Aucune note interne pour ce dossier.</div>}
            </Card>

            <div className="toolbar rise">
              <div className="toolbar-group">
                <span className="toolbar-count">Actions rapides</span>
              </div>
              <div className="toolbar-right">
                <Btn icon="edit" onClick={() => actions.admission(admission)}>Modifier le dossier</Btn>
                {admission.status !== 'inscrit' && <Btn icon="userPlus" solid onClick={() => actions.enrollAdmission(admission)}>Inscrire dans la classe</Btn>}
                <Btn icon="trash" onClick={() => actions.deleteAdmission(admission)}>Supprimer</Btn>
              </div>
            </div>
          </>
        )}
      </ListState>
    </>
  );
}
