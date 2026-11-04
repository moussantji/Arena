/* ============================================================
   Kalanso — écran de connexion
   ============================================================ */

import React, { useCallback, useRef, useState } from 'react';
import { useData } from './data.jsx';
import { Icon } from './ui.jsx';
import { WindowControls } from './layout.jsx';
import kalansoIcon from './assets/kalanso-icon.png';

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.63h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.86c2.26-2.08 3.58-5.14 3.58-8.8Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.93l-3.86-3c-1.07.72-2.44 1.15-4.07 1.15-3.13 0-5.78-2.11-6.72-4.95H1.29v3.09A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.28 14.27a7.2 7.2 0 0 1 0-4.54V6.64H1.29a12 12 0 0 0 0 10.72l3.99-3.09Z" />
      <path fill="#EA4335" d="M12 4.77c1.76 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.29 6.64l3.99 3.09C6.22 6.88 8.87 4.77 12 4.77Z" />
    </svg>
  );
}

export function Login({ onFirstSetup }) {
  const {
    signIn, signInWithToken, bootError, setBootError, notify,
  } = useData();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleWaiting, setGoogleWaiting] = useState(false);
  const googleBusyRef = useRef(false);
  const googleCancelRequestedRef = useRef(false);

  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setBootError(null);
    try {
      await signIn(email.trim(), password);
    } catch {
      /* L'erreur est déjà exposée dans bootError. */
    } finally {
      setLoading(false);
    }
  }, [email, password, signIn, setBootError, loading]);

  const handleGoogle = useCallback(async () => {
    // Un second clic pendant l'attente annule la tentative en cours ;
    // un nouveau clic relance immédiatement la connexion.
    if (googleBusyRef.current) {
      googleCancelRequestedRef.current = true;
      try {
        await window.desktopAPI?.googleCancel?.();
      } catch {
        /* annulation sans effet si rien n’est en cours */
      }
      return;
    }
    if (loading) return;

    if (!window.desktopAPI?.googleSignIn) {
      setBootError('La connexion Google est disponible dans l’application desktop Kalanso.');
      return;
    }

    googleCancelRequestedRef.current = false;
    googleBusyRef.current = true;
    setLoading(true);
    setGoogleWaiting(true);
    setBootError(null);
    try {
      const result = await window.desktopAPI.googleSignIn();
      if (!result?.ok) throw new Error(result?.message || 'La connexion Google a échoué.');
      await signInWithToken(result.token, result.user);
      if (result.first_account) {
        notify('Compte Direction créé. Complétez le nom de votre établissement dans Paramètres.', {
          tone: 'success',
        });
      }
    } catch (error) {
      const message = error?.message || 'La connexion Google a échoué.';
      if (/annulée/i.test(message)) {
        // Annulation volontaire (nouveau clic) : aucun message.
        if (!googleCancelRequestedRef.current) {
          setBootError('Connexion Google annulée.');
        }
      } else {
        setBootError(message);
      }
    } finally {
      googleBusyRef.current = false;
      setLoading(false);
      setGoogleWaiting(false);
    }
  }, [loading, notify, setBootError, signInWithToken]);

  return (
    <div className="login-screen">
      <div className="login-chrome">
        <span className="login-chrome-title">Kalanso · Application desktop</span>
        <WindowControls />
      </div>

      <span className="login-glow login-glow-a" aria-hidden="true" />
      <span className="login-glow login-glow-b" aria-hidden="true" />

      <section className="login-story">
        <div className="login-brand">
          <img className="brand-icon" src={kalansoIcon} alt="Kalanso" />
          <span>
            <b>KALANSO</b>
            <em>Gestion scolaire</em>
          </span>
        </div>

        <div className="login-copy">
          <span className="login-kicker">Espace de gestion</span>
          <h1>Tout l’établissement,<br />dans une seule application.</h1>
          <p>
            Élèves, classes, notes, finances, admissions et messagerie :
            retrouvez le quotidien de l’école dans un espace clair et sécurisé.
          </p>
          <ul className="login-points">
            <li>
              <span className="login-point-ic"><Icon name="classes" size={15} /></span>
              <span>
                <b>Cursus complet</b>
                <em>Dossiers, notes, absences et bulletins</em>
              </span>
            </li>
            <li>
              <span className="login-point-ic"><Icon name="profile" size={15} /></span>
              <span>
                <b>Accès par rôle</b>
                <em>Chaque équipe voit ce qui la concerne</em>
              </span>
            </li>
            <li>
              <span className="login-point-ic"><Icon name="finance" size={15} /></span>
              <span>
                <b>Pilotage financier</b>
                <em>Factures, paiements et recouvrement</em>
              </span>
            </li>
          </ul>
        </div>

        <div className="login-story-foot">
          <span>Kalanso · application locale</span>
          <span>Accès sécurisé</span>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <div className="login-card-head">
            <span className="login-eyebrow">Connexion</span>
            <h2>Bon retour.</h2>
            <p>Identifiez-vous avec votre compte de l’établissement.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {bootError && (
              <div className="login-alert" role="alert">
                <Icon name="close" size={14} />
                <span>{bootError}</span>
              </div>
            )}

            <label className="login-field" htmlFor="login-email">
              <span>Adresse e-mail</span>
              <span className="login-input">
                <Icon name="profile" size={15} />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="prenom@mon-ecole.com"
                  autoComplete="username"
                  autoFocus
                  required
                  disabled={loading}
                />
              </span>
            </label>

            <label className="login-field" htmlFor="login-password">
              <span>Mot de passe</span>
              <span className="login-input">
                <Icon name="settings" size={15} />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Votre mot de passe"
                  autoComplete="current-password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="login-eye"
                  onClick={() => setShowPassword((value) => !value)}
                  title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  <Icon name={showPassword ? 'eyeOff' : 'eye'} size={16} />
                </button>
              </span>
            </label>

            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? 'Connexion…' : 'Se connecter'}
              {!loading && <Icon name="chevronR" size={15} />}
            </button>

            <div className="login-divider"><span>ou</span></div>

            <button
              type="button"
              className="login-google"
              onClick={handleGoogle}
              disabled={loading && !googleWaiting}
              title={googleWaiting ? 'Annule l’attente en cours ; recliquez pour relancer.' : undefined}
            >
              <GoogleMark />
              <span>
                {googleWaiting ? 'En attente de Google — cliquez pour annuler'
                  : loading ? 'Connexion…' : 'Continuer avec Google'}
              </span>
            </button>

            {onFirstSetup && (
              <button
                type="button"
                className="login-first-run"
                onClick={onFirstSetup}
                disabled={loading}
              >
                Première installation · créer le compte Direction
              </button>
            )}
          </form>
        </div>

        <p className="login-legal">Application locale · Données hébergées sur cet appareil</p>
      </section>
    </div>
  );
}
