import React from 'react';
import { Card, CardHead, Btn, Pill, Icon } from './ui.jsx';
import { useModal } from './modal.jsx';
import { useData } from './data.jsx';
import { useActions } from './actions.jsx';
import { openConfirm } from './forms.jsx';
import { PageHead } from './pages/common.jsx';

/* ============================================================
   Atelier des modales — chaque carte ouvre un vrai formulaire
   relié à l’API, avec validation, confirmation et toast.
   ============================================================ */

const PREVIEW = ({ tone = '' }) => (
  <div className={`mg-preview ${tone}`}>
    <div className={`mini ${tone}`}>
      <i /><i /><i /><i />
    </div>
  </div>
);

export function Modales() {
  const modal = useModal();
  const { notify, meta } = useData();
  const actions = useActions();
  const student = meta?.students?.[0];

  const items = [
    {
      kind: 'wide',
      title: 'Nouvel élève',
      desc: 'Formulaire long en deux colonnes : identité, scolarité, tuteur. Validation serveur et focus piégé.',
      action: 'Ouvrir le formulaire',
      run: () => actions.student(),
    },
    {
      kind: 'center',
      title: 'Encaissement',
      desc: 'Montant, facture, moyen de paiement. Le statut de la facture est recalculé à l’enregistrement.',
      action: 'Encaisser',
      run: () => actions.payment(),
    },
    {
      kind: 'center',
      title: 'Facture',
      desc: 'Création d’une facture avec élève, nature des frais, échéance et montant.',
      action: 'Créer une facture',
      run: () => actions.invoice(),
    },
    {
      kind: 'wide',
      title: 'Membre du personnel',
      desc: 'Dossier RH complet : fonction, département, contrat et coordonnées.',
      action: 'Ajouter un membre',
      run: () => actions.staff(),
    },
    {
      kind: 'center danger',
      title: 'Confirmation destructive',
      desc: 'Ton rouge, action unique en bas à droite, Échap pour annuler.',
      action: 'Tester la confirmation',
      run: () => openConfirm(modal, {
        title: 'Supprimer cet enregistrement ?',
        message: 'Cette démonstration ne modifie aucune donnée. La confirmation destructive est identique à celle utilisée pour les suppressions réelles.',
        confirmLabel: 'Confirmer la démonstration',
        onConfirm: async () => true,
        success: 'Démonstration confirmée — aucune donnée supprimée.',
      }),
    },
    {
      kind: 'center success',
      title: 'Notification',
      desc: 'Chaque mutation affiche un toast non bloquant, avec le détail de l’opération.',
      action: 'Afficher un toast',
      run: () => notify('Élève créé et inscrit.', { detail: 'Aminata Cissé · Terminale S' }),
    },
    {
      kind: 'center',
      title: 'Absence',
      desc: 'Enregistrement d’une absence avec élève, date, créneau et motif.',
      action: 'Signaler une absence',
      run: () => actions.absence(),
    },
    {
      kind: 'center',
      title: 'Saisie de note',
      desc: 'Élève, matière, évaluation et barème. Les champs obligatoires sont validés côté client et serveur.',
      action: 'Saisir une note',
      run: () => actions.grade(),
    },
    {
      kind: 'wide',
      title: 'Candidature',
      desc: 'Dossier d’admission avec classe demandée, responsable légal et étape du pipeline.',
      action: 'Nouveau dossier',
      run: () => actions.admission(),
    },
    {
      kind: 'center',
      title: 'Rédaction',
      desc: 'Objet, destinataires et corps du message avant envoi aux familles ou à l’équipe.',
      action: 'Nouveau message',
      run: () => actions.thread(),
    },
    {
      kind: 'drawer',
      title: 'Panneau latéral',
      desc: 'Variante drawer glissant depuis la droite : fiche rapide de l’élève et actions.',
      action: 'Ouvrir la fiche rapide',
      run: () => actions.studentDrawer(student),
      hidden: !student,
    },
    {
      kind: 'center',
      title: 'Document',
      desc: 'Téléversement multipart dans le dossier élève : PDF, image ou document bureautique.',
      action: 'Ajouter un document',
      run: () => actions.document(student),
      hidden: !student,
    },
  ].filter((item) => !item.hidden);

  return (
    <>
      <PageHead
        id="modales"
        sub="Formulaires, confirmations et notifications reliés à l’API"
        primary="Nouvel élève"
        secondary="Confirmation"
        onPrimary={() => actions.student()}
        onSecondary={() => openConfirm(modal, {
          title: 'Action de démonstration',
          message: 'Aucune donnée ne sera modifiée.',
          confirmLabel: 'Continuer',
          busyLabel: 'Traitement…',
          destructive: false,
          onConfirm: async () => true,
          success: 'Démonstration validée.',
        })}
      />

      <div className="stats-row rise">
        <div className="stat">
          <b>{modal.stack.length}</b>
          <span>Modales dans la pile</span>
        </div>
        <div className="stat">
          <b className="tone-accent">4</b>
          <span>Variantes · center, wide, drawer, danger</span>
        </div>
        <div className="stat">
          <b>220 ms</b>
          <span>Durée de sortie</span>
        </div>
        <div className="stat">
          <b>⌘ ⇧ M</b>
          <span>Raccourci nouvel élève</span>
        </div>
      </div>

      <div className="trigger-row rise">
        <Btn icon="plus" solid onClick={() => actions.student()}>Nouvel élève</Btn>
        <Btn icon="finance" onClick={() => actions.payment()}>Encaisser</Btn>
        <Btn icon="absences" onClick={() => actions.absence()}>Absence</Btn>
        <Btn icon="grades" onClick={() => actions.grade()}>Note</Btn>
        <Btn icon="messages" onClick={() => actions.thread()}>Message</Btn>
        {student && <Btn icon="profile" onClick={() => actions.studentDrawer(student)}>Fiche rapide</Btn>}
        <Btn
          icon="close"
          onClick={() => openConfirm(modal, {
            title: 'Action de démonstration',
            message: 'Aucune donnée ne sera modifiée.',
            confirmLabel: 'Continuer',
            onConfirm: async () => true,
            success: 'Démonstration validée.',
          })}
        >
          Confirmation
        </Btn>
        {modal.stack.length > 0 && <Btn icon="close" onClick={modal.closeAll}>Tout fermer</Btn>}
      </div>

      <div className="modal-grid">
        {items.map((item, index) => (
          <Card key={item.title} className="mg-card rise" style={{ animationDelay: `${index * 40}ms` }}>
            <PREVIEW tone={item.kind} />
            <h3>{item.title}</h3>
            <p>{item.desc}</p>
            <Btn icon="external" onClick={item.run}>{item.action}</Btn>
          </Card>
        ))}
      </div>

      <div className="grid-main">
        <Card className="rise">
          <CardHead title="Comportement" sub="La couche modale partagée" />
          <ul className="notes-list" style={{ gap: 14 }}>
            {[
              ['Pile de modales', 'Chaque modale s’empile (z-index +10), la plus récente capte le focus.'],
              ['Focus piégé', 'Tab et Maj+Tab bouclent dans la modale ; le focus revient au déclencheur à la fermeture.'],
              ['Échap', 'Ferme la modale du dessus. Le clic sur le fond est désactivé si dismissible = false.'],
              ['Animations', 'Entrée fluide (opacité + échelle + flou), sortie courte, contenu en cascade.'],
              ['Verrou de scroll', 'body.modal-open fige la page derrière, sans saut de mise en page.'],
              ['Accessibilité', 'role="dialog", aria-modal, aria-labelledby, aria-describedby, fermeture nommée.'],
            ].map(([key, value]) => (
              <li key={key} style={{ gridTemplateColumns: '150px 1fr', alignItems: 'start' }}>
                <b style={{ textAlign: 'left', fontSize: 11.5 }}>{key}</b>
                <span style={{ fontSize: 11.5, color: 'var(--faint)', lineHeight: 1.55 }}>{value}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="rise" style={{ animationDelay: '80ms' }}>
          <CardHead title="Variantes" sub="Une seule API" />
          <div className="stack" style={{ gap: 10 }}>
            {[
              ['center', 'Par défaut · 520 px'],
              ['wide', 'Formulaires · 760 px'],
              ['drawer', 'Panneau latéral · 440 px'],
              ['tone-danger', 'Confirmation destructive'],
              ['tone-success', 'Confirmation positive'],
            ].map(([key, value]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <Pill tone={key.includes('danger') ? 'danger' : key.includes('success') ? 'accent' : 'muted'}>{key}</Pill>
                <span style={{ fontSize: 11, color: 'var(--faint)' }}>{value}</span>
              </div>
            ))}
          </div>
          <div className="mnote" style={{ marginTop: 14 }}>
            <Icon name="check" size={14} />
            open(config) accepte title, sub, icon, eyebrow, variant, size, tone, body, side, actions, dismissible.
          </div>
          <div className="mnote" style={{ marginTop: 8 }}>
            <Icon name="external" size={14} />
            Les formulaires sont fournis par useActions() et écrivent directement dans l’API.
          </div>
        </Card>
      </div>
    </>
  );
}
