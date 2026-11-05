import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TitleBar, Sidebar, TopBar, PAGES as NAV_PAGES } from './layout.jsx';
import { META, PAGES } from './pages.jsx';
import { useData } from './data.jsx';
import { useActions } from './actions.jsx';
import { OfflineBanner } from './offline-banner.jsx';
import { Login } from './login.jsx';
import { Setup } from './setup.jsx';
import { Btn, Icon } from './ui.jsx';
import { useModal } from './modal.jsx';
import { whatsNewModal } from './whats-new.jsx';
import { APP_VERSION } from './changelog.js';
import kalansoIcon from './assets/kalanso-icon.png';

/* ============================================================
   Kalanso — coquille de l'application
   Navigation, transitions et état de connexion à l'API.
   ============================================================ */

const ALL_PAGE_IDS = NAV_PAGES.map((p) => p.id);

export default function App() {
  const {
    meta, booting, bootError, bootstrap, user, can, canAccessPage,
    checkingSetup, setupStatus,
  } = useData();
  const actions = useActions();
  const modal = useModal();
  const whatsNewShown = useRef(false);
  const [pageId, setPageId] = useState(() => {
    const h = typeof window !== 'undefined' ? window.location.hash.replace('#', '') : '';
    return ALL_PAGE_IDS.includes(h) ? h : 'dashboard';
  });
  const [query, setQuery] = useState('');
  const [sidebar, setSidebar] = useState(false);
  const [tour, setTour] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [dir, setDir] = useState(1);
  const bodyRef = useRef(null);

  // Tous les hooks doivent être appelés avant les retours conditionnels :
  // l'écran de connexion et l'application partagent le même composant.

  const allowedIds = useMemo(
    () => ALL_PAGE_IDS.filter((id) => canAccessPage(id)),
    [canAccessPage],
  );
  const order = useMemo(
    () => NAV_PAGES.filter((p) => !p.hidden && canAccessPage(p.id)).map((p) => p.id),
    [canAccessPage],
  );

  const page = META[pageId] || META.dashboard;
  const Page = PAGES[pageId] || PAGES.dashboard;

  useEffect(() => {
    if (!user || canAccessPage(pageId)) return;
    const fallback = canAccessPage('dashboard') ? 'dashboard' : (order[0] || 'dashboard');
    setPageId(fallback);
    window.history.replaceState(null, '', `#${fallback}`);
  }, [user, pageId, canAccessPage, order]);

  /* Fenêtre « Nouveautés » : une fois par version, après connexion. */
  useEffect(() => {
    if (!user || !meta || whatsNewShown.current) return;
    whatsNewShown.current = true;

    let seen = null;
    try {
      seen = window.localStorage.getItem('kalanso.seen_version');
    } catch {
      /* stockage indisponible */
    }
    if (seen === APP_VERSION) return;

    try {
      window.localStorage.setItem('kalanso.seen_version', APP_VERSION);
    } catch {
      /* stockage indisponible */
    }
    modal.open(whatsNewModal(modal));
  }, [user, meta, modal]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return NAV_PAGES.filter(
      (p) => !p.hidden && canAccessPage(p.id) && (
        p.label.toLowerCase().includes(q)
        || (META[p.id]?.crumb.join(' ').toLowerCase() || '').includes(q)
      ),
    );
  }, [query, canAccessPage]);

  const go = (id, opts = {}) => {
    if (!ALL_PAGE_IDS.includes(id) || !canAccessPage(id)) return;
    setDir(opts.dir ?? (order.indexOf(id) > order.indexOf(pageId) ? 1 : -1));
    setPageId(id);
    setSidebar(false);
    window.history.replaceState(null, '', `#${id}`);
    const node = bodyRef.current;
    if (node && typeof node.scrollTo === 'function') {
      node.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (node) {
      node.scrollTop = 0;
    }
  };

  /* navigation par hash — utilisée par les fiches et les raccourcis */
  useEffect(() => {
    const onHash = () => {
      const next = window.location.hash.replace('#', '');
      if (allowedIds.includes(next) && next !== pageId) {
        setDir(order.indexOf(next) > order.indexOf(pageId) ? 1 : -1);
        setPageId(next);
        bodyRef.current?.scrollTo?.({ top: 0 });
      }
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [pageId, allowedIds, order]);

  /* raccourcis clavier — confort d'affichage */
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
        if (e.key === 'Escape') setQuery('');
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        document.querySelector('.search input')?.focus();
        return;
      }
      const index = order.indexOf(pageId);
      if (e.key === 'ArrowRight') go(order[Math.min(index + 1, order.length - 1)]);
      if (e.key === 'ArrowLeft') go(order[Math.max(index - 1, 0)]);
      if (e.key.toLowerCase() === 't') setTour((v) => !v);
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'm' && can('students.manage')) {
        e.preventDefault();
        actions.student();
      }
      const n = Number(e.key);
      if (!Number.isNaN(n) && n >= 1 && n <= 9 && order[n - 1]) go(order[n - 1]);
      if (e.key === '0' && order[9]) go(order[9]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pageId, order, can, actions]);

  /* visite guidée — uniquement parmi les pages autorisées */
  useEffect(() => {
    if (!tour || !order.length) return undefined;
    const id = setInterval(() => {
      setPageId((cur) => {
        const next = order[(order.indexOf(cur) + 1) % order.length];
        window.history.replaceState(null, '', `#${next}`);
        return next;
      });
      setDir(1);
    }, 4000);
    return () => clearInterval(id);
  }, [tour, order]);

  useEffect(() => {
    if (!user && setupOpen && setupStatus?.needs_setup) {
      document.title = 'Première configuration — Kalanso';
    } else if (!user) {
      document.title = 'Connexion — Kalanso';
    } else {
      document.title = `${page.label} — Kalanso`;
    }
  }, [page.label, user, setupOpen, setupStatus?.needs_setup]);

  if ((booting || checkingSetup) && !meta) {
    return (
      <div className="boot-screen">
        <div className="boot-mark"><img className="brand-icon" src={kalansoIcon} alt="Kalanso" /></div>
        <h1>KALANSO</h1>
        <p>Gestion scolaire · espace sécurisé</p>
        <div className="boot-loading">
          <span className="spinner large" />
          <span>{checkingSetup ? 'Préparation de Kalanso…' : 'Connexion au serveur…'}</span>
        </div>
      </div>
    );
  }

  if (!user && setupOpen && setupStatus?.needs_setup) {
    return <Setup onCancel={() => setSetupOpen(false)} />;
  }

  if (!user) {
    return (
      <Login
        onFirstSetup={setupStatus?.needs_setup ? () => setSetupOpen(true) : undefined}
      />
    );
  }

  if (!meta) {
    return (
      <div className="boot-screen">
        <div className="boot-mark"><img className="brand-icon" src={kalansoIcon} alt="Kalanso" /></div>
        <h1>KALANSO</h1>
        <p>Gestion scolaire · espace sécurisé</p>
        <div className="boot-error">
          <span className="state-ic"><Icon name="wifiOff" size={18} /></span>
          <b>Serveur injoignable</b>
          <em>{bootError || 'Le serveur de données ne répond pas.'} Vérifiez la connexion réseau de ce poste, puis réessayez.</em>
          <Btn icon="refresh" solid onClick={bootstrap}>Réessayer</Btn>
        </div>
      </div>
    );
  }

  if (!canAccessPage(pageId)) {
    // L'utilisateur n'a pas accès à la page actuelle, on le redirige
    // vers une page qu'il peut voir
    const fallback = canAccessPage('dashboard') ? 'dashboard' : (order[0] || 'dashboard');
    window.location.hash = fallback;
    return null;
  }

  return (
    <div className="shell">
      <TitleBar
        page={page}
        onMenu={() => setSidebar((v) => !v)}
      />

      <Sidebar pageId={pageId} onSelect={go} open={sidebar} />

      <main className="main">
        <OfflineBanner />
        <TopBar
          page={page}
          query={query}
          results={results}
          onSearch={setQuery}
          onPick={(id) => { go(id); setQuery(''); }}
          onNavigate={go}
        />

        <div className="page" ref={bodyRef}>
          <div className="stage">
            <div
              key={pageId}
              className={`page-body slide-${dir > 0 ? 'next' : 'prev'}`}
            >
              <Page />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
