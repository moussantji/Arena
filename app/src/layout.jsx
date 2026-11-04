import React, { useEffect, useRef, useState } from 'react';
import { Icon, Avatar, IconBtn, Btn } from './ui.jsx';
import { useData, dateTime, initials } from './data.jsx';
import { ROLE_LABELS } from './auth.js';
import { useActions } from './actions.jsx';
import kalansoIcon from './assets/kalanso-icon.png';

/* ============================================================
   Kalanso — chrome de l'application
   Navigation, établissement et notifications branchés sur l'API.
   ============================================================ */

export const NAV = {
  Pilotage: [
    { id: 'dashboard', label: 'Tableau de bord', icon: 'dashboard' },
    { id: 'eleves', label: 'Élèves', icon: 'students' },
    { id: 'classes', label: 'Classes', icon: 'classes' },
    { id: 'classe', label: 'Fiche classe', icon: 'classes' },
    { id: 'emploi-du-temps', label: 'Emploi du temps', icon: 'calendar' },
  ],
  Gestion: [
    { id: 'finances', label: 'Finances', icon: 'finance' },
    { id: 'personnel', label: 'Personnel', icon: 'staff' },
    { id: 'fiche-personnel', label: 'Fiche personnel', icon: 'staff', hidden: true },
    { id: 'messagerie', label: 'Messagerie', icon: 'messages', dynamicBadge: 'threads' },
  ],
  Pédagogie: [
    { id: 'matieres', label: 'Matières', icon: 'grades' },
    { id: 'notes', label: 'Notes', icon: 'grades' },
    { id: 'absences', label: 'Absences', icon: 'absences' },
    { id: 'fiche', label: 'Fiche élève', icon: 'profile' },
    { id: 'admissions', label: 'Admissions', icon: 'admissions' },
    { id: 'fiche-admission', label: 'Fiche admission', icon: 'admissions', hidden: true },
  ],
  Système: [
    { id: 'parametres', label: 'Paramètres', icon: 'settings' },
  ],
};

export const PAGES = Object.values(NAV).flat();

/* Contrôles de fenêtre façon Windows : réduire, agrandir/restaurer, fermer. */
export function WindowControls() {
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
        {school?.name || 'Kalanso'} — <b>{page.label}</b>
        {year ? ` · ${year}` : ''} · Electron 1440 × 900
      </div>

      <WindowControls />
    </header>
  );
}

export function Sidebar({ pageId, onSelect, open }) {
  const {
    meta, user, unreadThreads, canAccessPage, signOut,
  } = useData();
  const school = meta?.school;
  const roleLabel = ROLE_LABELS[user?.role] || 'Invité';
  const actions = useActions();
  const [signingOut, setSigningOut] = useState(false);

  const logout = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  // Filtrage des pages par rôle
  const filteredNav = Object.entries(NAV).reduce((acc, [group, items]) => {
    const visible = items.filter((it) => !it.hidden && canAccessPage(it.id));
    if (visible.length) {
      acc[group] = visible;
    }
    return acc;
  }, {});

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="brand">
        {school?.photo_url
          ? <img className="brand-photo" src={school.photo_url} alt={`Logo ${school?.name || 'Kalanso'}`} />
          : <img className="brand-icon" src={kalansoIcon} alt="Kalanso" />}
        <span className="brand-txt">
          <b>{school?.name || 'Kalanso'}</b>
          <em>Gestion scolaire</em>
        </span>
      </div>

      <nav className="nav">
        {Object.entries(filteredNav).map(([group, items]) => (
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
          <button
            type="button"
            className="user-id"
            onClick={() => actions.profile(user)}
            title="Voir mon profil"
            aria-label="Voir mon profil"
          >
            <Avatar initials={initials(user?.name || 'Kalanso')} size={30} src={user?.photo_url} />
            <span>
              <b>{user?.name || 'Utilisateur'}</b>
              <em className={`role-tag role-${user?.role || 'enseignant'}`}>{roleLabel}</em>
            </span>
          </button>
          <button
            type="button"
            className="logout-btn"
            onClick={logout}
            disabled={signingOut}
            title="Se déconnecter"
            aria-label="Se déconnecter"
          >
            <Icon name="logout" size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}

const NOTIFICATION_PAGES = {
  admission: 'admissions',
  inscription: 'admissions',
  enrollment: 'eleves',
  payment: 'finances',
  invoice: 'finances',
  finance: 'finances',
  absence: 'absences',
  message: 'messagerie',
  thread: 'messagerie',
  staff: 'personnel',
  student: 'eleves',
  grade: 'notes',
};

export function TopBar({
  page, onSearch, query, results, onPick, onNavigate,
}) {
  const {
    notifications, unread, markNotification, markAllNotifications, deleteNotification, user,
    canAccessPage,
  } = useData();
  const [openNotif, setOpenNotif] = useState(false);
  const notifRef = useRef(null);
  const actions = useActions();
  const displayInitials = user?.name ? initials(user.name) : 'DI';
  const roleLabel = ROLE_LABELS[user?.role] || 'Invité';

  const notificationTarget = (notification) => {
    const target = NOTIFICATION_PAGES[notification.type];
    return target && canAccessPage(target) ? target : null;
  };

  useEffect(() => {
    if (!openNotif) return undefined;
    const onPointer = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) setOpenNotif(false);
    };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [openNotif]);

  const openNotification = (notification) => {
    markNotification(notification);
    const target = notificationTarget(notification);
    if (!target) {
      setOpenNotif(false);
      return;
    }
    if (target === 'finances') {
      const financeTab = notification.type === 'payment' ? 2 : 1;
      try {
        window.sessionStorage.setItem('kalanso.finance.tab', String(financeTab));
      } catch {
        /* stockage indisponible */
      }
      window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent('kalanso:finance-tab', { detail: { tab: financeTab } }));
      }, 150);
    }
    setOpenNotif(false);
    onNavigate?.(target);
  };

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
                onClick={() => openNotification(n)}
                title={notificationTarget(n) ? 'Ouvrir la page concernée' : 'Marquer comme lue'}
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

      <button
        type="button"
        className="topbar-user"
        onClick={() => actions.profile(user)}
        title={`Profil · ${user?.name || 'utilisateur'} (${roleLabel})`}
        aria-label="Ouvrir mon profil"
      >
        <Avatar initials={displayInitials} size={32} src={user?.photo_url} />
      </button>
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
