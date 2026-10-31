import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TitleBar, Sidebar, TopBar, PAGES as NAV_PAGES } from './layout.jsx';
import { META, PAGES } from './pages.jsx';
import { useData } from './data.jsx';
import { useActions } from './actions.jsx';
import { Btn, Icon } from './ui.jsx';

/* ============================================================
   DIALLO — coquille de l'application
   Navigation, transitions et état de connexion à l'API.
   ============================================================ */

const ORDER = NAV_PAGES.map((p) => p.id);

export default function App() {
  const {
    meta, booting, bootError, bootstrap,
  } = useData();
  const actions = useActions();
  const [pageId, setPageId] = useState(() => {
    const h = typeof window !== 'undefined' ? window.location.hash.replace('#', '') : '';
    return ORDER.includes(h) ? h : 'dashboard';
  });
  const [query, setQuery] = useState('');
  const [sidebar, setSidebar] = useState(false);
  const [tour, setTour] = useState(false);
  const [dir, setDir] = useState(1);
  const bodyRef = useRef(null);

  const page = META[pageId] || META.dashboard;
  const Page = PAGES[pageId] || PAGES.dashboard;

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return NAV_PAGES.filter(
      (p) => p.label.toLowerCase().includes(q)
        || (META[p.id]?.crumb.join(' ').toLowerCase() || '').includes(q),
    );
  }, [query]);

  const go = (id, opts = {}) => {
    if (!ORDER.includes(id)) return;
    setDir(opts.dir ?? (ORDER.indexOf(id) > ORDER.indexOf(pageId) ? 1 : -1));
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
      if (ORDER.includes(next) && next !== pageId) {
        setDir(ORDER.indexOf(next) > ORDER.indexOf(pageId) ? 1 : -1);
        setPageId(next);
        bodyRef.current?.scrollTo?.({ top: 0 });
      }
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [pageId]);

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
      if (e.key === 'ArrowRight') go(ORDER[Math.min(ORDER.indexOf(pageId) + 1, ORDER.length - 1)]);
      if (e.key === 'ArrowLeft') go(ORDER[Math.max(ORDER.indexOf(pageId) - 1, 0)]);
      if (e.key.toLowerCase() === 't') setTour((v) => !v);
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        actions.student();
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
        window.history.replaceState(null, '', `#${next}`);
        return next;
      });
      setDir(1);
    }, 4000);
    return () => clearInterval(id);
  }, [tour]);

  useEffect(() => {
    document.title = `${page.label} — DIALLO`;
  }, [page.label]);

  if (!meta && (booting || bootError)) {
    return (
      <div className="boot-screen">
        <div className="boot-mark"><span className="mark" /></div>
        <h1>DIALLO</h1>
        <p>École internationale · espace de direction</p>
        {booting ? (
          <div className="boot-loading">
            <span className="spinner large" />
            <span>Connexion à l’API…</span>
          </div>
        ) : (
          <div className="boot-error">
            <span className="state-ic"><Icon name="close" size={18} /></span>
            <b>API indisponible</b>
            <em>{bootError}</em>
            <code>cd api &amp;&amp; php artisan serve --host=127.0.0.1 --port=8001</code>
            <Btn icon="refresh" solid onClick={bootstrap}>Réessayer</Btn>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="shell">
      <TitleBar
        page={page}
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
