import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TitleBar, Sidebar, TopBar, PageHeader, PAGES as NAV_PAGES } from './layout.jsx';
import { META, PAGES } from './pages.jsx';
import { useModals } from './modal.jsx';

/* ============================================================
   DIALLO — coquille de l'application
   Navigation et transitions uniquement : aucun appel réseau,
   aucune donnée calculée. Tout vient de mock.js.
   ============================================================ */

const ORDER = NAV_PAGES.map((p) => p.id);

export default function App() {
  const [pageId, setPageId] = useState(() => {
    const h = typeof window !== 'undefined' ? window.location.hash.replace('#', '') : '';
    return ORDER.includes(h) ? h : 'dashboard';
  });
  const [query, setQuery] = useState('');
  const [sidebar, setSidebar] = useState(false);
  const [tour, setTour] = useState(false);
  const [dir, setDir] = useState(1);
  const bodyRef = useRef(null);
  const modals = useModals();

  const page = META[pageId];
  const Page = PAGES[pageId];

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return NAV_PAGES.filter(
      (p) => p.label.toLowerCase().includes(q) || (META[p.id]?.crumb.join(' ').toLowerCase() || '').includes(q)
    );
  }, [query]);

  const go = (id, opts = {}) => {
    if (!ORDER.includes(id)) return;
    setDir(opts.dir ?? (ORDER.indexOf(id) > ORDER.indexOf(pageId) ? 1 : -1));
    setPageId(id);
    setSidebar(false);
    window.history.replaceState(null, '', '#' + id);
    const node = bodyRef.current;
    if (node && typeof node.scrollTo === 'function') {
      node.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (node) {
      node.scrollTop = 0;
    }
  };

  /* raccourcis clavier — confort d'affichage */
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT') {
        if (e.key === 'Escape') setQuery('');
        return;
      }
      if (e.key === 'ArrowRight') go(ORDER[Math.min(ORDER.indexOf(pageId) + 1, ORDER.length - 1)]);
      if (e.key === 'ArrowLeft') go(ORDER[Math.max(ORDER.indexOf(pageId) - 1, 0)]);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        document.querySelector('.search input')?.focus();
      }
      if (e.key.toLowerCase() === 't') setTour((v) => !v);
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        modals.student();
      }
      const n = Number(e.key);
      if (!Number.isNaN(n) && n >= 1 && n <= 9) go(ORDER[n - 1]);
      if (e.key === '0') go(ORDER[9]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pageId]);

  /* visite guidée */
  useEffect(() => {
    if (!tour) return undefined;
    const id = setInterval(() => {
      setPageId((cur) => {
        const next = ORDER[(ORDER.indexOf(cur) + 1) % ORDER.length];
        window.history.replaceState(null, '', '#' + next);
        return next;
      });
      setDir(1);
    }, 4000);
    return () => clearInterval(id);
  }, [tour]);

  useEffect(() => {
    document.title = `${page.label} — DIALLO`;
  }, [page.label]);

  /* actions d'en-tête : chaque page ouvre sa modale */
  const primaryActions = {
    dashboard: () => modals.student(),
    eleves: () => modals.student(),
    classes: () => modals.student(),
    'emploi-du-temps': () => modals.success({ title: 'Cours ajouté', sub: 'Le créneau est visible dans l’emploi du temps.', rows: [['Classe', 'Terminale S'], ['Créneau', 'Jeudi 10:00'], ['Salle', 'S204']] }),
    finances: () => modals.payment(),
    personnel: () => modals.student({ title: 'Ajouter un membre', sub: 'Personnel · 2025 — 2026' }),
    messagerie: () => modals.message(),
    notes: () => modals.student({ title: 'Saisir les notes', sub: 'Terminale S · Trimestre 1', icon: 'grades', eyebrow: 'Évaluation' }),
    absences: () => modals.absence(),
    fiche: () => modals.student({ title: 'Modifier la fiche', sub: 'Aminata Traoré · Terminale S' }),
    admissions: () => modals.student({ title: 'Nouveau dossier', sub: 'Admissions · Rentrée 2026' }),
    parametres: () => modals.success({ title: 'Paramètres enregistrés', sub: 'Les modifications sont appliquées à l’établissement.', rows: [['Établissement', 'École Internationale Diallo'], ['Devise', 'FCFA'], ['Langue', 'Français']] }),
    modales: () => modals.student(),
  };

  const secondaryActions = {
    parametres: () => modals.confirm({ title: 'Réinitialiser les paramètres ?', confirmLabel: 'Réinitialiser' }),
  };



  return (
    <div className="shell">
      <TitleBar
        page={page}
        tour={tour}
        onTour={() => setTour((v) => !v)}
        onMenu={() => setSidebar((v) => !v)}
      />

      <Sidebar pageId={pageId} onSelect={go} open={sidebar} />

      <main className="main">
        <TopBar
          page={page}
          query={query}
          results={results}
          onSearch={setQuery}
          onPick={(id) => { go(id); setQuery(''); }}
        />

        <div className="page" ref={bodyRef}>
          <PageHeader
            page={page}
            onPrimary={primaryActions[pageId] || (() => modals.success({}))}
            onSecondary={secondaryActions[pageId] || (() => modals.exportData())}
          />

          <div className="stage">
            <div
              key={pageId}
              className={`page-body slide-${dir > 0 ? 'next' : 'prev'}`}
            >
              <Page />
            </div>
          </div>

          <div className="dock">
            <button
              type="button"
              className="dbtn"
              onClick={() => go(ORDER[Math.max(ORDER.indexOf(pageId) - 1, 0)])}
              aria-label="Page précédente"
            >
              ‹
            </button>
            <span className="dock-index">
              <b>{String(ORDER.indexOf(pageId) + 1).padStart(2, '0')}</b> / {String(ORDER.length).padStart(2, '0')}
            </span>
            <span className="dock-progress">
              <i style={{ width: `${((ORDER.indexOf(pageId) + 1) / ORDER.length) * 100}%` }} />
            </span>
            <span className="dock-name">{page.label}</span>
            <button
              type="button"
              className="dbtn"
              onClick={() => go(ORDER[Math.min(ORDER.indexOf(pageId) + 1, ORDER.length - 1)])}
              aria-label="Page suivante"
            >
              ›
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
