import React from 'react';
import { Icon, Pill } from './ui.jsx';
import { APP_VERSION, CHANGELOG } from './changelog.js';

/* ============================================================
   Kalanso — fenêtre « Nouveautés »
   Présente la version courante puis les précédentes.
   ============================================================ */

export function whatsNewModal(api) {
  const { close } = api;

  const releases = [
    ...CHANGELOG.filter((release) => release.version === APP_VERSION),
    ...CHANGELOG.filter((release) => release.version !== APP_VERSION),
  ].slice(0, 3);

  const current = releases[0];

  return {
    title: 'Nouveautés de Kalanso',
    sub: `Version ${APP_VERSION}${current?.date ? ` · ${current.date}` : ''}`,
    eyebrow: 'Quoi de neuf',
    icon: 'bell',
    size: 580,
    body: (
      <div className="whats-new">
        {releases.map((release, index) => (
          <section className={`wn-release ${index === 0 ? 'current' : ''}`} key={release.version}>
            <div className="wn-head">
              <b>{release.title || `Version ${release.version}`}</b>
              <span className="wn-meta mono">
                {index === 0 ? <Pill tone="accent">Nouvelle version</Pill> : <Pill tone="muted">{release.version}</Pill>}
                {release.date}
              </span>
            </div>
            <ul className="wn-list">
              {release.items.map((item) => (
                <li key={item}>
                  <Icon name="check" size={13} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    ),
    actions: [
      { label: 'Compris', kind: 'primary', icon: 'check', onClick: () => close() },
    ],
  };
}
