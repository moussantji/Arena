import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import { createPortal } from 'react-dom';
import { Icon, Btn, Avatar, Pill } from './ui.jsx';

/* ============================================================
   DIALLO — modales personnalisées
   Pile de modales, animations d'entrée/sortie, focus piégé,
   fermeture par Échap, clic sur le fond, ou action.
   ============================================================ */

const ModalCtx = createContext(null);

export function useModal() {
  const ctx = useContext(ModalCtx);
  if (!ctx) throw new Error('useModal doit être utilisé dans <ModalProvider>');
  return ctx;
}

let seq = 0;

/* Hook de confort : ouvreurs prêts à l'emploi, sans manipulation de config. */
export function useModals() {
  const api = useModal();
  const { open } = api;
  return useMemo(
    () => ({
      ...api,
      student: (p) => open(StudentModal(api, p)),
      payment: (p) => open(PaymentModal(api, p)),
      confirm: (p) => open(ConfirmModal(api, p)),
      absence: (p) => open(AbsenceModal(api, p)),
      exportData: (p) => open(ExportModal(api, p)),
      drawer: (p) => open(StudentDrawer(api, p)),
      message: (p) => open(MessageModal(api, p)),
      success: (p) => open(SuccessModal(api, p)),
    }),
    [api, open]
  );
}

export function ModalProvider({ children }) {
  const [stack, setStack] = useState([]);
  const lastFocus = useRef(null);

  const open = useCallback((config) => {
    const id = `m${++seq}`;
    lastFocus.current = document.activeElement;
    setStack((s) => [...s, { id, closing: false, ...config }]);
    return id;
  }, []);

  const close = useCallback((id) => {
    setStack((s) => {
      const target = id ?? s[s.length - 1]?.id;
      return s.map((m) => (m.id === target ? { ...m, closing: true } : m));
    });
    /* retire du DOM après l'animation de sortie */
    window.setTimeout(() => {
      setStack((s) => {
        const target = id ?? s[s.length - 1]?.id;
        return s.filter((m) => m.id !== target);
      });
    }, 220);
  }, []);

  const closeAll = useCallback(() => {
    setStack((s) => s.map((m) => ({ ...m, closing: true })));
    window.setTimeout(() => setStack([]), 220);
  }, []);

  const api = useMemo(() => ({ open, close, closeAll, stack }), [open, close, closeAll, stack]);

  /* verrou de scroll + restauration du focus */
  useEffect(() => {
    const has = stack.some((m) => !m.closing);
    document.body.classList.toggle('modal-open', has);
    return () => document.body.classList.remove('modal-open');
  }, [stack]);

  useEffect(() => {
    if (stack.length === 0 && lastFocus.current instanceof HTMLElement) {
      lastFocus.current.focus?.();
    }
  }, [stack.length]);

  return (
    <ModalCtx.Provider value={api}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <div className={`modal-root ${stack.length ? 'has-modal' : ''}`}>
            {stack.map((m, i) => (
              <ModalFrame
                key={m.id}
                data={m}
                depth={i}
                onClose={() => close(m.id)}
                canClose={m.dismissible !== false}
              />
            ))}
          </div>,
          document.body
        )}
    </ModalCtx.Provider>
  );
}

/* ---------------- cadre + animations + focus ---------------- */
function ModalFrame({ data, depth, onClose, canClose }) {
  const panel = useRef(null);
  const {
    title, sub, variant = 'center', size, icon, eyebrow,
    body, actions, footer, side, tone,
  } = data;

  useEffect(() => {
    const node = panel.current;
    if (!node) return undefined;

    const focusables = () =>
      Array.from(
        node.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.disabled && el.tabIndex !== -1 && el.getAttribute('aria-hidden') !== 'true');

    const first = focusables()[0];
    first?.focus({ preventScroll: true });

    const onKey = (e) => {
      if (e.key === 'Escape' && canClose) {
        e.stopPropagation();
        onClose();
      }
      if (e.key === 'Tab') {
        const list = focusables();
        if (!list.length) return;
        const idx = list.indexOf(document.activeElement);
        e.preventDefault();
        const next = e.shiftKey ? (idx <= 0 ? list.length - 1 : idx - 1) : (idx + 1) % list.length;
        list[next].focus();
      }
    };
    node.addEventListener('keydown', onKey);
    return () => node.removeEventListener('keydown', onKey);
  }, [canClose, onClose]);

  const wide = variant === 'wide';
  const drawer = variant === 'drawer';

  return (
    <div
      className={`modal-layer ${data.closing ? 'closing' : ''} ${drawer ? 'is-drawer' : ''}`}
      style={{ zIndex: 1000 + depth * 10 }}
    >
      <button
        type="button"
        className="modal-backdrop"
        aria-label="Fermer"
        tabIndex={-1}
        onClick={() => canClose && onClose()}
      />

      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`mt-${data.id}`}
        aria-describedby={sub ? `md-${data.id}` : undefined}
        tabIndex={-1}
        className={[
          'modal-panel',
          `variant-${variant}`,
          wide ? 'is-wide' : '',
          tone ? `tone-${tone}` : '',
          data.closing ? 'out' : 'in',
        ].join(' ')}
        style={size ? { width: size } : undefined}
      >
        <div className="modal-glow" aria-hidden="true" />

        {(title || sub || eyebrow) && (
          <header className="modal-head">
            {icon && (
              <span className={`modal-icon ${tone ? `tone-${tone}` : ''}`}>
                <Icon name={icon} size={18} />
              </span>
            )}
            <div className="modal-titles">
              {eyebrow && <div className="modal-eyebrow">{eyebrow}</div>}
              {title && <h2 id={`mt-${data.id}`}>{title}</h2>}
              {sub && <p id={`md-${data.id}`}>{sub}</p>}
            </div>
            {canClose && (
              <button type="button" className="modal-x" onClick={onClose} aria-label="Fermer">
                <Icon name="close" size={14} />
              </button>
            )}
          </header>
        )}

        <div className="modal-body">
          {side ? (
            <div className="modal-split">
              <div className="modal-main">{body}</div>
              <aside className="modal-side">{side}</aside>
            </div>
          ) : (
            body
          )}
        </div>

        {(actions || footer) && (
          <footer className="modal-foot">
            {footer || (
              <>
                <span className="modal-hint">
                  <kbd>Échap</kbd> pour annuler
                </span>
                <div className="modal-actions">
                  {actions.map((a, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`btn ${a.kind === 'primary' ? 'solid' : ''} ${a.kind === 'danger' ? 'danger' : ''}`}
                      onClick={a.onClick ? a.onClick : onClose}
                    >
                      {a.icon && <Icon name={a.icon} size={14} />}
                      {a.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </footer>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   Parties réutilisables pour construire une modale
   ============================================================ */

export function MField({ label, hint, children }) {
  return (
    <label className="mfield">
      <span className="mfield-label">{label}{hint && <em>{hint}</em>}</span>
      {children}
    </label>
  );
}

export function MInput(props) {
  return <input className="input" {...props} />;
}

export function MSelect({ options = [], ...props }) {
  return (
    <span className="mselect">
      <select className="input" {...props}>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
      <Icon name="chevronR" size={12} className="mselect-caret" />
    </span>
  );
}

export function MTextarea(props) {
  return <textarea className="input textarea" rows={3} {...props} />;
}

export function MRow({ children }) {
  return <div className="mrow">{children}</div>;
}

export function MOptions({ items = [], value = 0 }) {
  return (
    <div className="moptions">
      {items.map((it, i) => (
        <label key={it.label} className={`moption ${i === value ? 'checked' : ''}`}>
          <span className="mradio"><i /></span>
          <span>
            <b>{it.label}</b>
            {it.desc && <em>{it.desc}</em>}
          </span>
          {it.badge && <Pill tone="muted">{it.badge}</Pill>}
        </label>
      ))}
    </div>
  );
}

export function MSummary({ rows = [] }) {
  return (
    <dl className="msummary">
      {rows.map(([k, v]) => (
        <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
      ))}
    </dl>
  );
}

/* ============================================================
   Modales prêtes à l'emploi
   ============================================================ */

export function StudentModal(api) {
  const { close } = api;
  return {
    title: 'Nouvel élève',
    sub: 'Inscription · année scolaire 2025 — 2026',
    icon: 'students',
    eyebrow: 'Admissions',
    variant: 'wide',
    body: (
      <>
        <div className="mcard">
          <div className="mcard-head">Identité</div>
          <MRow>
            <MField label="Prénom"><MInput placeholder="Aminata" /></MField>
            <MField label="Nom"><MInput placeholder="Traoré" /></MField>
          </MRow>
          <MRow>
            <MField label="Date de naissance"><MInput placeholder="12/03/2009" /></MField>
            <MField label="Sexe"><MSelect options={['Féminin', 'Masculin']} /></MField>
          </MRow>
        </div>

        <div className="mcard">
          <div className="mcard-head">Scolarité</div>
          <MRow>
            <MField label="Classe"><MSelect options={['Terminale S', 'Terminale L', 'Première S', 'Première ES', 'Seconde A', 'Seconde B']} /></MField>
            <MField label="Régime"><MSelect options={['Externe', 'Interne', 'Demi-pensionnaire']} /></MField>
          </MRow>
          <MRow>
            <MField label="Matricule" hint="auto"><MInput defaultValue="2026-0204" readOnly /></MField>
            <MField label="Statut"><MSelect options={['À jour', 'Boursier', 'En attente de paiement']} /></MField>
          </MRow>
        </div>

        <div className="mcard">
          <div className="mcard-head">Tuteur</div>
          <MRow>
            <MField label="Nom du tuteur"><MInput placeholder="Mme Traoré" /></MField>
            <MField label="Téléphone"><MInput placeholder="+223 76 00 00 00" /></MField>
          </MRow>
        </div>
      </>
    ),
    actions: [
      { label: 'Annuler', onClick: () => close() },
      { label: 'Créer l’élève', kind: 'primary', icon: 'plus', onClick: () => close() },
    ],
  };
}

export function PaymentModal(api) {
  const { close } = api;
  return {
    title: 'Enregistrer un paiement',
    sub: 'Reçu émis immédiatement',
    icon: 'finance',
    variant: 'center',
    body: (
      <>
        <MRow>
          <MField label="Élève"><MSelect options={['Aminata Traoré · Terminale S', 'Ibrahim Konaté · Terminale S', 'Awa Sow · Terminale L']} /></MField>
        </MRow>
        <MRow>
          <MField label="Motif"><MSelect options={['Frais de scolarité', 'Cantine', 'Transport', 'Frais d’examen']} /></MField>
          <MField label="Montant"><MInput defaultValue="450 000" /></MField>
        </MRow>
        <MRow>
          <MField label="Moyen de paiement"><MSelect options={['Espèces', 'Orange Money', 'Virement bancaire', 'Chèque']} /></MField>
          <MField label="Date"><MInput defaultValue="27/10/2026" /></MField>
        </MRow>
        <div className="mnote">
          <Icon name="check" size={14} />
          Le solde de l’élève sera mis à jour automatiquement.
        </div>
      </>
    ),
    actions: [
      { label: 'Annuler', onClick: () => close() },
      { label: 'Encaisser 450 000 FCFA', kind: 'primary', icon: 'check', onClick: () => close() },
    ],
  };
}

export function ConfirmModal(api, { title = 'Supprimer ce dossier ?', body, confirmLabel = 'Supprimer' } = {}) {
  const { close } = api;
  return {
    title,
    sub: 'Cette action est définitive.',
    icon: 'close',
    tone: 'danger',
    variant: 'center',
    size: 460,
    body: body || (
      <p className="mtext">
        Les informations liées à ce dossier seront retirées de l’application.
        Les documents déjà exportés ne seront pas modifiés.
      </p>
    ),
    actions: [
      { label: 'Annuler', onClick: () => close() },
      { label: confirmLabel, kind: 'danger', onClick: () => close() },
    ],
  };
}

export function AbsenceModal(api) {
  const { close } = api;
  return {
    title: 'Justifier une absence',
    sub: 'Moussa Camara · Seconde A · 15 février 2026',
    icon: 'absences',
    variant: 'center',
    body: (
      <>
        <MRow>
          <MField label="Motif"><MSelect options={['Maladie', 'Raison familiale', 'Transport', 'Rendez-vous médical']} /></MField>
          <MField label="Durée"><MSelect options={['1 jour', '2 jours', '3 jours', 'Semaine']} /></MField>
        </MRow>
        <MField label="Commentaire" hint="facultatif">
          <MTextarea placeholder="Certificat médical transmis par le tuteur…" />
        </MField>
        <div className="mnote">
          <Icon name="external" size={14} />
          Le tuteur recevra une notification de confirmation.
        </div>
      </>
    ),
    actions: [
      { label: 'Annuler', onClick: () => close() },
      { label: 'Valider la justification', kind: 'primary', icon: 'check', onClick: () => close() },
    ],
  };
}

export function ExportModal(api) {
  const { close } = api;
  return {
    title: 'Exporter les données',
    sub: 'Choisissez le format et la période',
    icon: 'download',
    variant: 'center',
    size: 520,
    body: (
      <>
        <div className="mcard-head">Format</div>
        <MOptions
          items={[
            { label: 'PDF', desc: 'Mise en page prête à imprimer', badge: 'conseillé' },
            { label: 'Excel', desc: 'Tableur avec toutes les colonnes' },
            { label: 'CSV', desc: 'Import dans un autre logiciel' },
          ]}
        />
        <div className="mcard-head" style={{ marginTop: 16 }}>Période</div>
        <MRow>
          <MField label="Du"><MInput defaultValue="01/09/2025" /></MField>
          <MField label="Au"><MInput defaultValue="27/10/2026" /></MField>
        </MRow>
      </>
    ),
    actions: [
      { label: 'Annuler', onClick: () => close() },
      { label: 'Télécharger', kind: 'primary', icon: 'download', onClick: () => close() },
    ],
  };
}

export function StudentDrawer(api, { student } = {}) {
  const { close, open } = api;
  const s = student || {
    name: 'Aminata Traoré', ref: '2026-0142', cls: 'Terminale S', who: 'AT',
    status: 'À jour', avg: '12,80', balance: '8,45 M FCFA',
  };

  return {
    title: s.name,
    sub: `${s.cls} · ${s.ref}`,
    eyebrow: 'Fiche rapide',
    variant: 'drawer',
    icon: 'profile',
    dismissible: true,
    body: (
      <>
        <div className="drawer-id">
          <Avatar initials={s.who} size={54} />
          <div>
            <b>{s.name}</b>
            <span>{s.cls} · Matricule {s.ref}</span>
            <div className="drawer-chips">
              <Pill tone="accent">{s.status}</Pill>
              <Pill tone="muted">Interne</Pill>
              <Pill tone="copper">Moyenne {s.avg}</Pill>
            </div>
          </div>
        </div>

        <MSummary
          rows={[
            ['Solde', s.balance],
            ['Tuteur', 'Mme Traoré'],
            ['Téléphone', '+223 76 00 00 00'],
            ['Assiduité', '96,8 %'],
            ['Dernier paiement', '28/02/2026'],
          ]}
        />

        <div className="mcard-head" style={{ marginTop: 18 }}>Actions rapides</div>
        <div className="drawer-actions">
          <Btn icon="messages" onClick={() => close()}>Message au tuteur</Btn>
          <Btn icon="finance" onClick={() => { close(); open(PaymentModal(api)); }}>Encaisser</Btn>
          <Btn icon="download" onClick={() => close()}>Bulletin PDF</Btn>
          <Btn
            icon="close"
            onClick={() => {
              close();
              open(ConfirmModal(api, { title: 'Retirer cet élève ?', confirmLabel: 'Retirer' }));
            }}
          >
            Retirer
          </Btn>
        </div>
      </>
    ),
    actions: [
      { label: 'Fermer', onClick: () => close() },
      { label: 'Ouvrir la fiche', kind: 'primary', icon: 'external', onClick: () => close() },
    ],
  };
}

export function MessageModal(api) {
  const { close } = api;
  return {
    title: 'Nouveau message',
    sub: 'Aux familles ou à l’équipe',
    icon: 'messages',
    variant: 'center',
    size: 560,
    body: (
      <>
        <MRow>
          <MField label="Destinataire"><MSelect options={['Mme Traoré · parent', 'M. Konaté · parent', 'Équipe pédagogique', 'Tous les parents du lycée']} /></MField>
        </MRow>
        <MField label="Objet"><MInput placeholder="Suivi de l’assiduité — octobre" /></MField>
        <MField label="Message"><MTextarea rows={5} placeholder="Bonjour Madame, …" /></MField>
      </>
    ),
    actions: [
      { label: 'Annuler', onClick: () => close() },
      { label: 'Envoyer', kind: 'primary', icon: 'chevronR', onClick: () => close() },
    ],
  };
}

export function SuccessModal(api, { title = 'C’est enregistré', sub, rows = [] } = {}) {
  const { close } = api;
  return {
    title,
    sub: sub || 'La modification est visible immédiatement.',
    variant: 'center',
    size: 420,
    tone: 'success',
    icon: 'check',
    body: rows.length ? <MSummary rows={rows} /> : null,
    actions: [{ label: 'Fermer', kind: 'primary', onClick: () => close() }],
  };
}
