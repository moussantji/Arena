import React from 'react';
import { Icon, Avatar, IconBtn, Btn } from './ui.jsx';
import { school, notifications } from './mock.js';

/* ============================================================
   Chrome de l'application — présentation uniquement
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
    { id: 'messagerie', label: 'Messagerie', icon: 'messages', badge: 2 },
  ],
  Pédagogie: [
    { id: 'notes', label: 'Notes', icon: 'grades' },
    { id: 'absences', label: 'Absences', icon: 'absences' },
    { id: 'fiche', label: 'Fiche élève', icon: 'profile' },
    { id: 'admissions', label: 'Admissions', icon: 'admissions' },
  ],
  Système: [{ id: 'parametres', label: 'Paramètres', icon: 'settings' }],
};

export const PAGES = Object.values(NAV).flat();

export function TitleBar({ page, onTour, tour, onMenu }) {
  return (
    <header className="titlebar">
      <div className="lights">
        <button className="l1" aria-label="Fermer" />
        <button className="l2" aria-label="Réduire" />
        <button className="l3" aria-label="Agrandir" />
      </div>

      <IconBtn icon="menu" className="menu-btn" onClick={onMenu} title="Menu" />

      <div className="win-title">
        {school.name} — <b>{page.label}</b> · Electron 1440 × 900
      </div>

      <div className="titlebar-right">
        <button className={`pill-ghost ${tour ? 'on' : ''}`} onClick={onTour} title="Visite guidée (T)">
          <Icon name={tour ? 'pause' : 'play'} size={11} />
          <span>{tour ? 'Pause' : 'Visite'}</span>
        </button>
        <span className="pill-ghost static" title="Direction visuelle">
          <i className="swatch-dot" />
          Indigo
        </span>
      </div>
    </header>
  );
}

export function Sidebar({ pageId, onSelect, open }) {
  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="brand">
        <span className="mark" />
        <span className="brand-txt">
          <b>{school.name}</b>
          <em>École internationale</em>
        </span>
      </div>

      <nav className="nav">
        {Object.entries(NAV).map(([group, items]) => (
          <React.Fragment key={group}>
            <div className="nav-label">{group}</div>
            {items.map((it) => (
              <button
                key={it.id}
                type="button"
                className={`nav-item ${pageId === it.id ? 'active' : ''}`}
                onClick={() => onSelect(it.id)}
              >
                <Icon name={it.icon} size={17} />
                <span>{it.label}</span>
                {it.badge && <em className="nav-badge">{it.badge}</em>}
              </button>
            ))}
          </React.Fragment>
        ))}
      </nav>

      <div className="sidebar-foot">
        <div className="user">
          <Avatar initials={school.user.initials} size={30} />
          <span>
            <b>{school.user.name}</b>
            <em>{school.user.role}</em>
          </span>
        </div>
      </div>
    </aside>
  );
}

export function TopBar({ page, onSearch, query, results, onPick }) {
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

      <div className="notif">
        <IconBtn icon="bell" badge title="Notifications" />
        <div className="notif-pop">
          <div className="notif-head">Notifications</div>
          {notifications.map((n) => (
            <div className="notif-item" key={n.title}>
              <b>{n.title}</b>
              <span>{n.body}</span>
              <em>{n.time}</em>
            </div>
          ))}
        </div>
      </div>

      <Avatar initials={school.user.initials} size={32} />
    </div>
  );
}

export function PageHeader({ page, children }) {
  return (
    <div className="page-head">
      <div className="ttl">
        <h1>{page.title}</h1>
        <p>{page.sub}</p>
      </div>
      <div className="head-actions">
        {page.secondary && <Btn icon="download">{page.secondary}</Btn>}
        {page.primary && <Btn icon="plus" solid>{page.primary}</Btn>}
        {children}
      </div>
    </div>
  );
}
