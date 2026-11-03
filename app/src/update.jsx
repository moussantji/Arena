import React, {
  useCallback, useEffect, useRef, useState,
} from 'react';
import { Btn, Icon, Pill, Progress } from './ui.jsx';
import { APP_VERSION } from './changelog.js';

/* ============================================================
   Kalanso — mises à jour
   Vérification, téléchargement et installation dans l'app.
   ============================================================ */

function updatesApi() {
  if (typeof window === 'undefined') return null;
  return window.desktopAPI?.updates || null;
}

const formatBytes = (value) => {
  const bytes = Number(value || 0);
  if (!bytes) return '';
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} Mo`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${bytes} o`;
};

const cleanNotes = (notes) => String(notes || '')
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<\/(p|li|h\d)>/gi, '\n')
  .replace(/<li>/gi, '• ')
  .replace(/<[^>]*>/g, ' ')
  .replace(/\n{3,}/g, '\n\n')
  .replace(/[ \t]{2,}/g, ' ')
  .trim();

const friendlyError = (message) => {
  const text = String(message || '');
  if (/ENOTFOUND|EAI_AGAIN|getaddrinfo/i.test(text)) {
    return 'Canal de mise à jour injoignable. Vérifiez l’adresse KALANSO_UPDATE_URL.';
  }
  if (/ECONNREFUSED|ECONNRESET|ETIMEDOUT/i.test(text)) {
    return 'Canal de mise à jour injoignable. Vérifiez votre connexion et l’adresse KALANSO_UPDATE_URL.';
  }
  if (/app-update\.yml|update config|ENOENT/i.test(text)) {
    return 'Aucun canal de mise à jour n’est configuré sur cette installation.';
  }
  return text || 'La mise à jour a échoué.';
};

const STATE_TEXT = {
  idle: 'Cliquez sur « Vérifier les mises à jour ».',
  checking: 'Recherche d’une nouvelle version…',
  'not-available': 'Kalanso est à jour.',
  available: 'Une nouvelle version est disponible.',
  downloading: 'Téléchargement de la mise à jour…',
  downloaded: 'Mise à jour téléchargée : redémarrez pour l’installer.',
  error: 'La mise à jour a échoué.',
  unavailable: 'Disponible dans l’application desktop installée.',
};

export function UpdatePanel() {
  const api = updatesApi();
  const checkedRef = useRef(false);
  const [version, setVersion] = useState(APP_VERSION);
  const [state, setState] = useState(api ? 'idle' : 'unavailable');
  const [latest, setLatest] = useState(null);
  const [notes, setNotes] = useState('');
  const [percent, setPercent] = useState(0);
  const [total, setTotal] = useState(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!api) return undefined;

    api.version?.().then((value) => {
      if (value) setVersion(value);
    }).catch(() => {});

    const off = api.onStatus?.((status) => {
      if (!status) return;
      setState(status.state || 'idle');
      if (status.version) setLatest(status.version === version ? null : status.version);
      if (status.percent != null) setPercent(status.percent);
      if (status.total) setTotal(status.total);
      if (status.message) setMessage(friendlyError(status.message));
      if (status.notes) setNotes(cleanNotes(status.notes));
    });

    return () => {
      if (typeof off === 'function') off();
    };
  }, [api, version]);

  const check = useCallback(async () => {
    if (!api) return;
    setState('checking');
    setMessage('');
    setPercent(0);
    setNotes('');
    setLatest(null);

    const result = await api.check?.();
    if (!result?.ok) {
      // En développement, la vérification n'est possible que dans
      // l'application installée : c'est une information, pas une erreur.
      if (/application installée/i.test(result?.message || '')) {
        setState('unavailable');
        setMessage('');
      } else {
        setState('error');
        setMessage(friendlyError(result?.message));
      }
      return;
    }
    if (result.available) {
      setState('available');
      setLatest(result.latest || null);
      setNotes(cleanNotes(result.notes));
    } else {
      setState('not-available');
      setLatest(null);
    }
  }, [api]);

  useEffect(() => {
    if (!api || checkedRef.current) return;
    checkedRef.current = true;
    check();
  }, [api, check]);

  const download = useCallback(async () => {
    if (!api) return;
    setState('downloading');
    setPercent(0);
    setMessage('');

    const result = await api.download?.();
    if (!result?.ok) {
      setState('error');
      setMessage(friendlyError(result?.message));
    }
  }, [api]);

  const install = useCallback(() => {
    api?.install?.().then((result) => {
      if (result && !result.ok) {
        setState('error');
        setMessage(friendlyError(result.message));
      }
    }).catch(() => {});
  }, [api]);

  const busy = state === 'checking' || state === 'downloading';

  return (
    <div className="update-panel">
      <div className="update-head">
        <span className={`update-ic ${state === 'error' ? 'danger' : ''}`}>
          <Icon name="download" size={18} />
        </span>
        <div>
          <b>Version installée : {version}</b>
          <span>{STATE_TEXT[state] || 'Vérification de l’application.'}</span>
        </div>
      </div>

      {state === 'downloading' && (
        <div className="update-progress">
          <Progress value={percent} height={6} />
          <span className="mono">
            {percent}%
            {total ? ` · ${formatBytes(total)}` : ''}
          </span>
        </div>
      )}

      {latest && (state === 'available' || state === 'downloaded') && (
        <div className="update-version">
          <span className="update-version-head">
            <Pill tone="accent">Version {latest}</Pill>
            {state === 'downloaded' && <Pill tone="accent" dot>Prête à installer</Pill>}
          </span>
          {notes && <p className="update-notes">{notes}</p>}
        </div>
      )}

      {message && (
        <div className={`update-message ${state === 'error' ? 'danger' : ''}`}>
          <Icon name={state === 'error' ? 'close' : 'check'} size={13} />
          <span>{message}</span>
        </div>
      )}

      <div className="update-actions">
        {state === 'available' && (
          <Btn icon="download" solid onClick={download}>Télécharger la mise à jour</Btn>
        )}
        {state === 'downloaded' && (
          <Btn icon="refresh" solid onClick={install}>Redémarrer et installer</Btn>
        )}
        {state !== 'available' && state !== 'downloaded' && (
          <Btn
            icon="refresh"
            solid={state !== 'unavailable'}
            onClick={check}
            disabled={busy || state === 'unavailable'}
          >
            {state === 'checking' ? 'Vérification…' : 'Vérifier les mises à jour'}
          </Btn>
        )}
      </div>
    </div>
  );
}

export function updateModal(api) {
  const { close } = api;

  return {
    title: 'Mise à jour de Kalanso',
    sub: 'Vérification, téléchargement et installation dans l’application.',
    eyebrow: 'Mises à jour',
    icon: 'download',
    size: 580,
    body: <UpdatePanel />,
    actions: [{ label: 'Fermer', onClick: () => close() }],
  };
}
