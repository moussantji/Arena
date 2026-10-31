import React, { useEffect, useRef, useState } from 'react';
import { Icon, Avatar, IconBtn, Btn } from './ui.jsx';
import { useData, dateTime, initials } from './data.jsx';

/* ============================================================
   DIALLO — chrome de l'application
   Navigation, établissement et notifications branchés sur l'API.
   ============================================================ */

export const NAV = {
  Pilotage: [
    { id: 'dashboard', label: 'Tableau de bord', icon: 'dashboard' },
    { id: 'eleves', label: 'Élèves', icon: 'students' },
    { id: 'classes', label: 'Classes', icon: 'classes' },
    { id: 'emploi-du-temps', label: 'Emploi du temps', icon: 'calendar' },
  ],
  Gestion: [
    { id: 'finances', label: 'Finances', icon: 'finance' },
    { id: 'personnel', label: 'Personnel', icon: 'staff' },
    { id: 'messagerie', label: 'Messagerie', icon: 'messages', dynamicBadge: 'threads' },
  ],
  Pédagogie: [
    { id: 'matieres', label: 'Matières', icon: 'grades' },
    { id: 'notes', label: 'Notes', icon: 'grades' },
    { id: 'absences', label: 'Absences', icon: 'absences' },
    { id: 'fiche', label: 'Fiche élève', icon: 'profile' },
    { id: 'admissions', label: 'Admissions', icon: 'admissions' },
  ],
  Système: [
    { id: 'modales', label: 'Modales', icon: 'external' },
    { id: 'parametres', label: 'Paramètres', icon: 'settings' },
  ],
};

export const PAGES = Object.values(NAV).flat();

/* Contrôles de fenêtre façon Windows : réduire, agrandir/restaurer, fermer. */
function WindowControls() {
  const api = typeof window !== 'undefined' ? window.desktopAPI : null;
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    if (!api?.onState) return undefined;
    return api.onState((state) => setMaximized(Boolean(state?.maximized)));
  }, [api]);

  if (!api) return null;

  return (
    <div className="window-controls" aria-label="Contrôles de fenêtre">
      <button
        type="button"
        className="wc"
        onClick={() => api.minimize?.()}
        title="Réduire"
        aria-label="Réduire"
      >
        <svg viewBox="0 0 10 10" aria-hidden="true"><path d="M0 5h10" /></svg>
      </button>
      <button
        type="button"
        className="wc"
        onClick={() => api.toggleMaximize?.()}
        title={maximized ? 'Restaurer' : 'Agrandir'}
        aria-label={maximized ? 'Restaurer' : 'Agrandir'}
      >
        <svg viewBox="0 0 10 10" aria-hidden="true">
          {maximized
            ? <><path d="M2.5 2.5h7v7h-7z" /><path d="M0.5 5V0.5h7" /></>
            : <path d="M0.5 0.5h9v9h-9z" />}
        </svg>
      </button>
      <button
        type="button"
        className="wc wc-close"
        onClick={() => api.close?.()}
        title="Fermer"
        aria-label="Fermer"
      >
        <svg viewBox="0 0 10 10" aria-hidden="true"><path d="M0 0l10 10M10 0L0 10" /></svg>
      </button>
    </div>
  );
}

export function TitleBar({ page, onMenu }) {
  const { meta } = useData();
  const school = meta?.school;
  const year = meta?.academic_year?.label || school?.academic_year || '';
  return (
    <header
      className="titlebar"
      onDoubleClick={(event) => {
        if (event.target.closest('button, .window-controls')) return;
        window.desktopAPI?.toggleMaximize?.();
      }}
    >
      <IconBtn icon="menu" className="menu-btn" onClick={onMenu} title="Menu" />

      <div className="win-title">
        {school?.name || 'DIALLO'} — <b>{page.label}</b>
        {year ? ` · ${year}` : ''} · Electron 1440 × 900
      </div>

      <WindowControls />
    </header>
  );
}

export function Sidebar({ pageId, onSelect, open }) {
  const { meta, user, unreadThreads } = useData();
  const school = meta?.school;
  const displayUser = user?.name ? {
    name: user.name,
    role: user.role || 'Direction',
    initials: initials(user.name),
  } : {
    name: 'M. Diallo',
    role: 'Direction',
    initials: 'MD',
  };

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="brand">
        {school?.photo_url
          ? <img className="brand-photo" src={school.photo_url} alt={`Logo ${school?.name || 'DIALLO'}`} />
          : <span className="mark" />}
        <span className="brand-txt">
          <b>{school?.name || 'DIALLO'}</b>
          <em>École internationale</em>
        </span>
      </div>

      <nav className="nav">
        {Object.entries(NAV).map(([group, items]) => (
          <React.Fragment key={group}>
            <div className="nav-label">{group}</div>
            {items.map((it) => {
              const badge = it.dynamicBadge === 'threads' ? unreadThreads : it.badge;
              return (
                <button
                  key={it.id}
                  type="button"
                  className={`nav-item ${pageId === it.id ? 'active' : ''}`}
                  onClick={() => onSelect(it.id)}
                >
                  <Icon name={it.icon} size={17} />
                  <span>{it.label}</span>
                  {badge > 0 && <em className="nav-badge">{badge > 99 ? '99+' : badge}</em>}
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </nav>

      <div className="sidebar-foot">
        <div className="user">
          <Avatar initials={displayUser.initials} size={30} src={user?.photo_url} />
          <span>
            <b>{displayUser.name}</b>
            <em>{displayUser.role}</em>
          </span>
        </div>
      </div>
    </aside>
  );
}

export function TopBar({ page, onSearch, query, results, onPick }) {
  const {
    notifications, unread, markNotification, markAllNotifications, deleteNotification, user,
  } = useData();
  const [openNotif, setOpenNotif] = useState(false);
  const notifRef = useRef(null);
  const displayInitials = user?.name ? initials(user.name) : 'MD';

  useEffect(() => {
    if (!openNotif) return undefined;
    const onPointer = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) setOpenNotif(false);
    };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [openNotif]);

  return (
    <div className="topbar">
      <div className="crumbs">
        <span className="c">{page.crumb[0]}</span>
        <span className="sep">·</span>
        <span className="c cur">{page.crumb[1]}</span>
      </div>

      <div className="search">
        <Icon name="search" size={14} className="search-ic" />
        <input
          type="text"
          placeholder="Rechercher une page…"
          value={query}
          onChange={(e) => onSearch(e.target.value)}
          spellCheck="false"
        />
        <kbd>⌘K</kbd>

        {query && (
          <div className="search-pop">
            {results.length ? (
              results.map((r) => (
                <button key={r.id} type="button" onClick={() => onPick(r.id)}>
                  <Icon name={r.icon} size={14} />
                  <span>{r.label}</span>
                  <em>{r.group}</em>
                </button>
              ))
            ) : (
              <div className="search-empty">Aucune page</div>
            )}
          </div>
        )}
      </div>

      <div className={`notif ${openNotif ? 'open' : ''}`} ref={notifRef}>
        <button
          type="button"
          className="icon-btn"
          title="Notifications"
          aria-label="Notifications"
          aria-expanded={openNotif}
          onClick={() => setOpenNotif((value) => !value)}
        >
          <Icon name="bell" size={15} />
          {unread > 0 && <i className="dot-badge" />}
        </button>
        <div className="notif-pop">
          <div className="notif-head">
            <span>Notifications {unread > 0 ? `· ${unread}` : ''}</span>
            {unread > 0 && (
              <button type="button" className="notif-action" onClick={markAllNotifications}>
                Tout lire
              </button>
            )}
          </div>
          {notifications.length ? notifications.map((n) => (
            <div className={`notif-item ${n.read_at ? '' : 'unread'}`} key={n.id}>
              <button
                type="button"
                className="notif-main"
                onClick={() => markNotification(n)}
                title={n.read_at ? 'Déjà lue' : 'Marquer comme lue'}
              >
                <b>{n.title}</b>
                <span>{n.body}</span>
                <em>{dateTime(n.created_at)}</em>
              </button>
              <button type="button" className="notif-del" onClick={() => deleteNotification(n)} aria-label="Supprimer la notification">
                <Icon name="close" size={10} />
              </button>
            </div>
          )) : (
            <div className="notif-empty">Aucune notification</div>
          )}
        </div>
      </div>

      <Avatar initials={displayInitials} size={32} src={user?.photo_url} />
    </div>
  );
}

export function PageHeader({ page, children, onPrimary, onSecondary }) {
  return (
    <div className="page-head">
      <div className="ttl">
        <h1>{page.title}</h1>
        <p>{page.sub}</p>
      </div>
      <div className="head-actions">
        {page.secondary && (
          <Btn icon={page.secondaryIcon || 'download'} onClick={onSecondary}>{page.secondary}</Btn>
        )}
        {page.primary && (
          <Btn icon={page.primaryIcon || 'plus'} solid onClick={onPrimary}>{page.primary}</Btn>
        )}
        {children}
      </div>
    </div>
  );
}
