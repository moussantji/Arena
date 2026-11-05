import React from 'react';
import { useData } from './data.jsx';
import { Icon } from './ui.jsx';

/* ============================================================
   Kalanso — bandeau « hors-ligne »
   Affiché quand le serveur de données ne répond plus (coupure
   réseau, serveur arrêté). Les données visibles peuvent être
   obsolètes ; la reconnexion est tentée automatiquement toutes
   les 10 secondes et le bouton « Réessayer » force une sonde.
   ============================================================ */

export function OfflineBanner() {
  const { apiOnline, retrying, retryConnection } = useData();

  if (apiOnline) return null;

  return (
    <div className="offline-banner" role="alert">
      <Icon name="wifiOff" size={16} />
      <span className="offline-text">
        <b>Connexion au serveur perdue.</b>
        <em>Les données affichées peuvent être obsolètes.</em>
      </span>
      <button
        type="button"
        className="offline-retry"
        onClick={retryConnection}
        disabled={retrying}
      >
        {retrying
          ? <span className="spinner small" aria-hidden="true" />
          : <Icon name="refresh" size={12} />}
        {retrying ? 'Vérification…' : 'Réessayer'}
      </button>
    </div>
  );
}
