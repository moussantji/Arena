import React from 'react';
import { Card, CardHead, Btn, Pill, Icon } from './ui.jsx';
import { useModals } from './modal.jsx';

/* ============================================================
   Page de démonstration des modales personnalisées
   ============================================================ */

const MINI = ({ kind }) => (
  <div className="mg-preview">
    <div className={`mini ${kind}`}>
      <i /><i /><i /><i />
    </div>
  </div>
);

export function Modales() {
  const modals = useModals();
  const { stack, closeAll, open } = modals;

  const items = [
    {
      kind: 'center',
      title: 'Formulaire',
      desc: 'Champs, sections, aide contextuelle. Deux colonnes sur desktop, une sur mobile.',
      action: 'Nouvel élève',
      run: () => modals.student(),
    },
    {
      kind: 'wide',
      title: 'Formulaire long',
      desc: 'Variante large (760 px) pour les dossiers complets, corps défilant, pied fixe.',
      action: 'Ajouter un membre',
      run: () => modals.student({ title: 'Ajouter un membre', sub: 'Personnel · année 2025 — 2026', icon: 'staff', eyebrow: 'Ressources humaines' }),
    },
    {
      kind: 'center',
      title: 'Paiement',
      desc: 'Saisie d’un encaissement, montant rappelé dans l’action principale.',
      action: 'Encaisser',
      run: () => modals.payment(),
    },
    {
      kind: 'center danger',
      title: 'Confirmation destructive',
      desc: 'Ton rouge, action unique en bas à droite, Échap pour annuler.',
      action: 'Supprimer',
      run: () => modals.confirm({}),
    },
    {
      kind: 'center success',
      title: 'Succès',
      desc: 'Retour immédiat après une action, résumé des valeurs enregistrées.',
      action: 'Voir le succès',
      run: () => modals.success({
        title: 'Élève créé',
        sub: 'Aminata Cissé a été ajoutée à la Terminale S.',
        rows: [['Matricule', '2026-0204'], ['Classe', 'Terminale S'], ['Statut', 'À jour']],
      }),
    },
    {
      kind: 'wide',
      title: 'Choix multiples',
      desc: 'Options radio avec description et badge — export PDF, Excel ou CSV.',
      action: 'Exporter',
      run: () => modals.exportData(),
    },
    {
      kind: 'center',
      title: 'Justification',
      desc: 'Motif, durée et commentaire libre pour justifier une absence.',
      action: 'Justifier',
      run: () => modals.absence(),
    },
    {
      kind: 'center',
      title: 'Rédaction',
      desc: 'Destinataire, objet et corps du message avant envoi aux familles.',
      action: 'Nouveau message',
      run: () => modals.message(),
    },
    {
      kind: 'drawer',
      title: 'Panneau latéral',
      desc: 'Variante drawer (440 px) glissant depuis la droite : fiche rapide, détails.',
      action: 'Ouvrir le drawer',
      run: () => modals.drawer(),
    },
  ];

  return (
    <>
      <div className="stats-row rise">
        <div className="stat">
          <b>{stack.length}</b>
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
          <span>Raccourci de démonstration</span>
        </div>
      </div>

      <div className="trigger-row rise">
        <Btn icon="plus" solid onClick={() => modals.student()}>Nouvel élève</Btn>
        <Btn icon="finance" onClick={() => modals.payment()}>Encaisser</Btn>
        <Btn icon="absences" onClick={() => modals.absence()}>Justifier</Btn>
        <Btn icon="download" onClick={() => modals.exportData()}>Exporter</Btn>
        <Btn icon="messages" onClick={() => modals.message()}>Message</Btn>
        <Btn icon="profile" onClick={() => modals.drawer()}>Fiche rapide</Btn>
        <Btn icon="close" onClick={() => modals.confirm({})}>Supprimer</Btn>
        <Btn
          icon="dots"
          onClick={() => {
            modals.student();
            setTimeout(() => modals.confirm({ title: 'Créer sans photo ?', confirmLabel: 'Continuer' }), 280);
          }}
        >
          Pile à deux niveaux
        </Btn>
        {stack.length > 0 && <Btn icon="close" onClick={closeAll}>Tout fermer</Btn>}
      </div>

      <div className="modal-grid">
        {items.map((it, i) => (
          <Card key={it.title} className="mg-card rise" style={{ animationDelay: `${i * 45}ms` }}>
            <MINI kind={it.kind} />
            <h3>{it.title}</h3>
            <p>{it.desc}</p>
            <Btn icon="external" onClick={it.run}>{it.action}</Btn>
          </Card>
        ))}
      </div>

      <div className="grid-main">
        <Card className="rise">
          <CardHead title="Comportement" sub="Ce que fait la couche modale" />
          <ul className="notes-list" style={{ gap: 14 }}>
            {[
              ['Pile de modales', 'Chaque modale s’empile (z-index +10), la plus récente capte le focus.'],
              ['Focus piégé', 'Tab et Maj+Tab bouclent dans la modale ; le focus revient au déclencheur à la fermeture.'],
              ['Échap', 'Ferme la modale du dessus. Le clic sur le fond est désactivé si dismissible = false.'],
              ['Animations', 'Entrée 420 ms (opacité + échelle + flou), sortie 220 ms, contenu en cascade.'],
              ['Verrou de scroll', 'body.modal-open fige la page derrière, sans saut de mise en page.'],
              ['Accessibilité', 'role="dialog", aria-modal, aria-labelledby, aria-describedby, fermeture nommée.'],
            ].map(([k, v]) => (
              <li key={k} style={{ gridTemplateColumns: '150px 1fr', alignItems: 'start' }}>
                <b style={{ textAlign: 'left', fontSize: 11.5 }}>{k}</b>
                <span style={{ fontSize: 11.5, color: 'var(--faint)', lineHeight: 1.55 }}>{v}</span>
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
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <Pill tone={k.includes('danger') ? 'danger' : k.includes('success') ? 'accent' : 'muted'}>{k}</Pill>
                <span style={{ fontSize: 11, color: 'var(--faint)' }}>{v}</span>
              </div>
            ))}
          </div>
          <div className="mnote" style={{ marginTop: 14 }}>
            <Icon name="check" size={14} />
            open(config) accepte title, sub, icon, eyebrow, variant, size, tone, body, side, actions, dismissible.
          </div>
          <div className="mnote" style={{ marginTop: 8 }}>
            <Icon name="external" size={14} />
            useModals() expose student(), payment(), confirm(), absence(), exportData(), drawer(), message(), success().
          </div>
        </Card>
      </div>
    </>
  );
}
