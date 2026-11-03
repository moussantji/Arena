/* ============================================================
   Kalanso — première configuration
   Création de l'établissement, de l'année scolaire et du
   premier compte Direction. Affiché uniquement sur base vide.
   ============================================================ */

import React, { useCallback, useMemo, useState } from 'react';
import { useData } from './data.jsx';
import { Icon } from './ui.jsx';
import { WindowControls } from './layout.jsx';
import kalansoIcon from './assets/kalanso-icon.png';

function schoolYearDefaults() {
  const now = new Date();
  const startYear = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;

  return {
    year_label: `${startYear} — ${startYear + 1}`,
    year_starts_on: `${startYear}-09-01`,
    year_ends_on: `${startYear + 1}-06-30`,
  };
}

export function Setup() {
  const {
    completeSetup, bootError, setBootError, setupStatus,
  } = useData();
  const defaults = useMemo(schoolYearDefaults, []);
  const [form, setForm] = useState({
    school_name: '',
    school_full_name: '',
    school_email: '',
    school_phone: '',
    school_address: '',
    currency: 'FCFA',
    ...defaults,
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const setField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
    setFormError('');
  };

  const submit = useCallback(async (event) => {
    event.preventDefault();
    if (loading) return;

    if (!form.school_name.trim() || !form.school_full_name.trim()) {
      setFormError('Renseignez le nom court et le nom complet de l’établissement.');
      return;
    }
    if (!form.name.trim() || !form.email.trim()) {
      setFormError('Renseignez le nom et l’adresse e-mail du compte Direction.');
      return;
    }
    if (form.password.length < 8) {
      setFormError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (form.password !== form.password_confirmation) {
      setFormError('Les deux mots de passe ne correspondent pas.');
      return;
    }
    if (!form.year_starts_on || !form.year_ends_on || form.year_ends_on <= form.year_starts_on) {
      setFormError('La date de fin de l’année scolaire doit suivre son début.');
      return;
    }

    setLoading(true);
    setFormError('');
    setBootError(null);
    try {
      await completeSetup({
        ...form,
        school_name: form.school_name.trim(),
        school_full_name: form.school_full_name.trim(),
        name: form.name.trim(),
        email: form.email.trim(),
      });
    } catch {
      /* L'erreur est exposée dans bootError par le contexte. */
    } finally {
      setLoading(false);
    }
  }, [completeSetup, form, loading, setBootError]);

  const alert = formError || bootError;

  return (
    <div className="login-screen setup-screen">
      <div className="login-chrome">
        <span className="login-chrome-title">Kalanso · Première configuration</span>
        <WindowControls />
      </div>

      <span className="login-glow login-glow-a" aria-hidden="true" />
      <span className="login-glow login-glow-b" aria-hidden="true" />

      <section className="login-story setup-story">
        <div className="login-brand">
          <img className="brand-icon" src={kalansoIcon} alt="Kalanso" />
          <span>
            <b>KALANSO</b>
            <em>Gestion scolaire</em>
          </span>
        </div>

        <div className="login-copy">
          <span className="login-kicker">Bienvenue</span>
          <h1>Votre établissement,<br />enfin réuni.</h1>
          <p>
            Kalanso est prêt à accueillir vos vraies données. Créez votre
            établissement, votre année scolaire et le premier compte Direction.
          </p>
          <ul className="login-points">
            <li>
              <span className="login-point-ic"><Icon name="settings" size={15} /></span>
              <span>
                <b>Une base neuve</b>
                <em>Aucun compte ni aucune donnée de démonstration</em>
              </span>
            </li>
            <li>
              <span className="login-point-ic"><Icon name="profile" size={15} /></span>
              <span>
                <b>Votre compte Direction</b>
                <em>Le point de départ de toute l’équipe</em>
              </span>
            </li>
            <li>
              <span className="login-point-ic"><Icon name="calendar" size={15} /></span>
              <span>
                <b>Année et trimestres</b>
                <em>Le calendrier pédagogique créé automatiquement</em>
              </span>
            </li>
          </ul>
        </div>

        <div className="login-story-foot">
          <span>Kalanso · application locale</span>
          <span>{setupStatus?.app_name || 'Kalanso'}</span>
        </div>
      </section>

      <section className="login-panel setup-panel">
        <div className="login-card setup-card">
          <div className="login-card-head">
            <span className="login-eyebrow">Mise en route</span>
            <h2>Créer votre espace.</h2>
            <p>Ces informations restent sur cet appareil et peuvent être modifiées ensuite.</p>
          </div>

          <form className="login-form setup-form" onSubmit={submit}>
            {alert && (
              <div className="login-alert" role="alert">
                <Icon name="close" size={14} />
                <span>{alert}</span>
              </div>
            )}

            <div className="setup-section">
              <span className="setup-step">01</span>
              <span>
                <b>Établissement</b>
                <em>Le nom affiché dans l’application et les documents.</em>
              </span>
            </div>

            <div className="setup-grid">
              <label className="login-field">
                <span>Nom court</span>
                <span className="login-input">
                  <input
                    value={form.school_name}
                    onChange={(event) => setField('school_name', event.target.value)}
                    placeholder="Mon établissement"
                    autoFocus
                    required
                    disabled={loading}
                  />
                </span>
              </label>
              <label className="login-field">
                <span>Nom complet</span>
                <span className="login-input">
                  <input
                    value={form.school_full_name}
                    onChange={(event) => setField('school_full_name', event.target.value)}
                    placeholder="École internationale"
                    required
                    disabled={loading}
                  />
                </span>
              </label>
              <label className="login-field">
                <span>Adresse e-mail</span>
                <span className="login-input">
                  <input
                    type="email"
                    value={form.school_email}
                    onChange={(event) => setField('school_email', event.target.value)}
                    placeholder="contact@mon-ecole.com"
                    disabled={loading}
                  />
                </span>
              </label>
              <label className="login-field">
                <span>Téléphone</span>
                <span className="login-input">
                  <input
                    value={form.school_phone}
                    onChange={(event) => setField('school_phone', event.target.value)}
                    placeholder="+223 70 00 00 00"
                    disabled={loading}
                  />
                </span>
              </label>
              <label className="login-field span-2">
                <span>Adresse</span>
                <span className="login-input">
                  <input
                    value={form.school_address}
                    onChange={(event) => setField('school_address', event.target.value)}
                    placeholder="Ville, quartier"
                    disabled={loading}
                  />
                </span>
              </label>
              <label className="login-field">
                <span>Devise</span>
                <span className="login-input">
                  <select
                    value={form.currency}
                    onChange={(event) => setField('currency', event.target.value)}
                    disabled={loading}
                  >
                    <option value="FCFA">FCFA</option>
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                  </select>
                </span>
              </label>
            </div>

            <div className="setup-section">
              <span className="setup-step">02</span>
              <span>
                <b>Année scolaire</b>
                <em>Trois trimestres seront créés automatiquement.</em>
              </span>
            </div>

            <div className="setup-grid">
              <label className="login-field span-2">
                <span>Libellé</span>
                <span className="login-input">
                  <input
                    value={form.year_label}
                    onChange={(event) => setField('year_label', event.target.value)}
                    placeholder="2026 — 2027"
                    required
                    disabled={loading}
                  />
                </span>
              </label>
              <label className="login-field">
                <span>Début</span>
                <span className="login-input">
                  <input
                    type="date"
                    value={form.year_starts_on}
                    onChange={(event) => setField('year_starts_on', event.target.value)}
                    required
                    disabled={loading}
                  />
                </span>
              </label>
              <label className="login-field">
                <span>Fin</span>
                <span className="login-input">
                  <input
                    type="date"
                    value={form.year_ends_on}
                    onChange={(event) => setField('year_ends_on', event.target.value)}
                    required
                    disabled={loading}
                  />
                </span>
              </label>
            </div>

            <div className="setup-section">
              <span className="setup-step">03</span>
              <span>
                <b>Compte Direction</b>
                <em>Ce compte administre l’établissement et les autres accès.</em>
              </span>
            </div>

            <div className="setup-grid">
              <label className="login-field span-2">
                <span>Nom du responsable</span>
                <span className="login-input">
                  <input
                    value={form.name}
                    onChange={(event) => setField('name', event.target.value)}
                    placeholder="Prénom et nom"
                    required
                    disabled={loading}
                  />
                </span>
              </label>
              <label className="login-field">
                <span>Adresse e-mail</span>
                <span className="login-input">
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => setField('email', event.target.value)}
                    placeholder="direction@mon-ecole.com"
                    autoComplete="username"
                    required
                    disabled={loading}
                  />
                </span>
              </label>
              <label className="login-field">
                <span>Mot de passe</span>
                <span className="login-input">
                  <input
                    type="password"
                    value={form.password}
                    onChange={(event) => setField('password', event.target.value)}
                    placeholder="8 caractères minimum"
                    autoComplete="new-password"
                    required
                    disabled={loading}
                  />
                </span>
              </label>
              <label className="login-field">
                <span>Confirmer le mot de passe</span>
                <span className="login-input">
                  <input
                    type="password"
                    value={form.password_confirmation}
                    onChange={(event) => setField('password_confirmation', event.target.value)}
                    placeholder="Répéter le mot de passe"
                    autoComplete="new-password"
                    required
                    disabled={loading}
                  />
                </span>
              </label>
            </div>

            <p className="setup-hint">
              Vous pourrez lier ce compte à Google plus tard en vous connectant
              avec la même adresse e-mail.
            </p>

            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? 'Création de votre espace…' : 'Créer mon espace Kalanso'}
              {!loading && <Icon name="chevronR" size={15} />}
            </button>
          </form>
        </div>

        <p className="login-legal">Application locale · Vos données restent sur cet appareil</p>
      </section>
    </div>
  );
}
