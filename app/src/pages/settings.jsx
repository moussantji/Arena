import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Avatar, Btn, Card, CardHead, Icon, Pill, Table, Tr, Toggle,
} from '../ui.jsx';
import {
  useApi, useData, number, money, date, compactMoney, fullName, initials,
} from '../data.jsx';
import { useActions } from '../actions.jsx';
import { ActionMenu, ListState } from '../forms.jsx';
import { PageHead } from './common.jsx';
import {
  api, API_URL, getToken, setSession,
} from '../api.js';
import {
  ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS,
} from '../auth.js';
import kalansoIcon from '../assets/kalanso-icon.png';

const TABS = ['Établissement', 'Calendrier', 'Départements', 'Frais', 'Utilisateurs', 'Préférences'];
const TAB_ICONS = ['settings', 'calendar', 'classes', 'finance', 'profile', 'settings'];
const ROLE_TONES = {
  direction: 'accent',
  secretariat: 'glass',
  comptable: 'copper',
  enseignant: 'muted',
};
const DEFAULT_PREFS = { reduceMotion: false, compact: false };

const readPrefs = () => {
  try {
    return { ...DEFAULT_PREFS, ...(JSON.parse(window.localStorage.getItem('kalanso.prefs')) || {}) };
  } catch {
    return DEFAULT_PREFS;
  }
};

export function Parametres() {
  const {
    meta, refresh, notify, user, booting, setUser,
  } = useData();
  const actions = useActions();
  const [tab, setTab] = useState(0);
  const [form, setForm] = useState({
    name: '', full_name: '', email: '', phone: '', address: '', currency: 'FCFA',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formError, setFormError] = useState('');
  const [testing, setTesting] = useState(false);
  const [prefs, setPrefs] = useState(readPrefs);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInput = useRef(null);

  const years = useApi('/references/academic-years');
  const departments = useApi('/references/departments');
  const feeTypes = useApi('/references/fee-types');
  const users = useApi('/users');
  const health = useApi('/health', undefined, { silent: true });

  const school = meta?.school;
  const currency = school?.currency || 'FCFA';
  const counts = meta?.counts || {};
  const yearRows = years.data?.academic_years || [];
  const departmentRows = departments.data?.departments || [];
  const feeRows = feeTypes.data?.fee_types || [];
  const userRows = users.data?.users || [];

  useEffect(() => {
    if (!school) return;
    setForm({
      name: school.name || '',
      full_name: school.full_name || '',
      email: school.email || '',
      phone: school.phone || '',
      address: school.address || '',
      currency: school.currency || 'FCFA',
    });
  }, [school]);

  useEffect(() => {
    window.localStorage.setItem('kalanso.prefs', JSON.stringify(prefs));
    document.documentElement.classList.toggle('reduce-motion', Boolean(prefs.reduceMotion));
    document.documentElement.classList.toggle('compact-ui', Boolean(prefs.compact));
  }, [prefs]);

  const setField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
    setSaved(false);
    setFormError('');
  };

  const saveSchool = async () => {
    if (saving) return;
    if (!form.name.trim() || !form.full_name.trim()) {
      setFormError('Le nom court et le nom complet sont obligatoires.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await api.patch('/school', form);
      notify('Informations de l’établissement enregistrées.');
      setSaved(true);
      refresh();
      window.setTimeout(() => setSaved(false), 2600);
    } catch (error) {
      setFormError(error.firstError || error.message || 'Impossible d’enregistrer.');
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    try {
      // Utiliser l'API pour tester la connexion
      const result = await api.get('/me');
      notify(`Connexion opérationnelle · ${result.user?.name || 'Direction'}.`);
      health.reload();
    } catch (error) {
      notify(error.message || 'Connexion à l’API impossible.', { tone: 'danger' });
    } finally {
      setTesting(false);
    }
  };

  const uploadAvatar = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const form = new FormData();
      form.append('avatar', file);
      const result = await api.upload('/me/avatar', form);
      setSession(getToken(), result.user);
      setUser(result.user);
      notify('Photo de profil mise à jour.');
      refresh();
    } catch (error) {
      notify(error.firstError || error.message || 'Téléversement impossible.', { tone: 'danger' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const resetPrefs = () => {
    setPrefs(DEFAULT_PREFS);
    notify('Préférences d’affichage réinitialisées.');
  };

  const feesTotal = useMemo(
    () => feeRows.reduce((sum, fee) => sum + Number(fee.default_amount || 0), 0),
    [feeRows],
  );

  const apiPill = health.loading
    ? <Pill tone="muted">Vérification…</Pill>
    : health.error
      ? <Pill tone="danger">Hors ligne</Pill>
      : <Pill tone="accent" dot>API connectée</Pill>;

  return (
    <>
      <PageHead
        id="parametres"
        sub={`${school?.full_name || 'Établissement'} · ${meta?.academic_year?.label || ''} · ${meta?.term?.name || ''}`}
        primary={tab === 0 ? 'Enregistrer' : undefined}
        secondary={null}
        onPrimary={tab === 0 ? saveSchool : undefined}
      />

      <div className="settings rise">
        <nav className="set-nav" aria-label="Sections des paramètres">
          {TABS.map((label, index) => (
            <button
              key={label}
              type="button"
              className={`set-item ${tab === index ? 'active' : ''}`}
              onClick={() => setTab(index)}
            >
              <Icon name={TAB_ICONS[index]} size={14} />
              {label}
            </button>
          ))}
          <div className="set-nav-foot">
            {apiPill}
            <span className="mono">{API_URL.replace(/^https?:\/\//, '')}</span>
          </div>
        </nav>

        <div className="set-main">
          {tab === 0 && (
            <div className="stack">
              <Card>
                <CardHead
                  title="Identité de l’établissement"
                  sub="Ces informations apparaissent dans l’application et les documents."
                  right={saved ? <Pill tone="accent" dot>Enregistré</Pill> : <Pill tone="muted">Brouillon</Pill>}
                />
                {formError && (
                  <div className="form-alert" role="alert">
                    <Icon name="close" size={14} />
                    <span>{formError}</span>
                  </div>
                )}
                <div className="form-grid">
                  <label className="field">
                    <span className="field-label">Nom court</span>
                    <input className="input" value={form.name} onChange={(event) => setField('name', event.target.value)} placeholder="Mon établissement" />
                  </label>
                  <label className="field">
                    <span className="field-label">Nom complet</span>
                    <input className="input" value={form.full_name} onChange={(event) => setField('full_name', event.target.value)} placeholder="École internationale" />
                  </label>
                  <label className="field">
                    <span className="field-label">E-mail</span>
                    <input className="input" type="email" value={form.email} onChange={(event) => setField('email', event.target.value)} placeholder="contact@mon-ecole.com" />
                  </label>
                  <label className="field">
                    <span className="field-label">Téléphone</span>
                    <input className="input" value={form.phone} onChange={(event) => setField('phone', event.target.value)} placeholder="+223 76 00 00 00" />
                  </label>
                  <label className="field span-2">
                    <span className="field-label">Adresse</span>
                    <input className="input" value={form.address} onChange={(event) => setField('address', event.target.value)} placeholder="Hamdallaye ACI 2000, Bamako" />
                  </label>
                  <label className="field">
                    <span className="field-label">Devise</span>
                    <select className="input" value={form.currency} onChange={(event) => setField('currency', event.target.value)}>
                      <option value="FCFA">FCFA</option>
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                    </select>
                  </label>
                </div>
                <div className="form-footer">
                  <span className="form-hint">Les modifications sont appliquées immédiatement dans l’interface.</span>
                  <div className="form-actions">
                    <Btn icon="upload" onClick={() => school && actions.photo(school, { kind: 'school' })}>Remplacer le logo</Btn>
                    <Btn icon="check" solid onClick={saveSchool}>{saving ? 'Enregistrement…' : 'Enregistrer les informations'}</Btn>
                  </div>
                </div>
              </Card>

              <div className="settings-cards">
                <Card className="settings-brief">
                  <span className="settings-logo">
                    {school?.photo_url
                      ? <img src={school.photo_url} alt={`Logo ${school?.name || 'Kalanso'}`} />
                      : <img src={kalansoIcon} alt="Logo Kalanso par défaut" />}
                  </span>
                  <div>
                    <b>{school?.name || 'Kalanso'}</b>
                    <span>{school?.full_name || 'École Internationale'}</span>
                    <em className="mono">{school?.address || 'Bamako'} · {school?.phone || ''}</em>
                  </div>
                </Card>
                <Card className="settings-brief">
                  <Icon name="students" size={18} />
                  <div><b>{number(counts.students)}</b><span>élèves actifs</span></div>
                </Card>
                <Card className="settings-brief">
                  <Icon name="staff" size={18} />
                  <div><b>{number(counts.staff)}</b><span>membres du personnel</span></div>
                </Card>
                <Card className="settings-brief">
                  <Icon name="classes" size={18} />
                  <div><b>{number(counts.classes)}</b><span>classes ouvertes</span></div>
                </Card>
              </div>
            </div>
          )}

          {tab === 1 && (
            <div className="stack">
              <Card>
                <CardHead
                  title="Années scolaires"
                  sub="Calendrier de l’établissement et périodes de notation"
                  right={<Btn icon="plus" solid onClick={() => actions.year()}>Nouvelle année</Btn>}
                />
                <ListState
                  loading={years.loading && !years.data}
                  error={years.error}
                  empty={!years.loading && !years.error && !yearRows.length}
                  emptyTitle="Aucune année scolaire"
                  emptySub="Créez l’année scolaire en cours."
                  onRetry={years.reload}
                >
                  <div className="year-list">
                    {yearRows.map((year) => (
                      <div className={`year-card ${year.is_current ? 'current' : ''}`} key={year.id}>
                        <div className="year-head">
                          <span className="year-badge mono">{year.label}</span>
                          {year.is_current && <Pill tone="accent" dot>Année courante</Pill>}
                          <span className="year-range mono">{date(year.starts_on)} → {date(year.ends_on)}</span>
                          <ActionMenu actions={[
                            { label: 'Modifier l’année', icon: 'edit', onClick: () => actions.year(year) },
                            { label: 'Supprimer', icon: 'trash', tone: 'danger', onClick: () => actions.deleteYear(year) },
                          ]} />
                        </div>
                        <div className="term-list">
                          {(year.terms || []).map((term) => (
                            <div className={`term-row ${term.is_current ? 'current' : ''}`} key={term.id}>
                              <span className="term-name">
                                <Icon name="clock" size={13} />
                                <b>{term.name}</b>
                                {term.is_current && <Pill tone="accent">En cours</Pill>}
                              </span>
                              <span className="term-range mono">{date(term.starts_on)} → {date(term.ends_on)}</span>
                              <span className="term-actions">
                                <button type="button" className="icon-btn" title="Modifier" onClick={() => actions.term(term)}><Icon name="edit" size={13} /></button>
                                <button type="button" className="icon-btn" title="Supprimer" onClick={() => actions.deleteTerm(term)}><Icon name="close" size={12} /></button>
                              </span>
                            </div>
                          ))}
                          <button type="button" className="term-add" onClick={() => actions.term({ academic_year_id: year.id })}>
                            <Icon name="plus" size={12} /> Ajouter une période
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ListState>
              </Card>

              <div className="settings-cards two">
                <Card>
                  <CardHead title="Année courante" sub="Utilisée par défaut" />
                  <dl className="dl">
                    <div><dt>Libellé</dt><dd className="mono">{meta?.academic_year?.label || '—'}</dd></div>
                    <div><dt>Début</dt><dd>{date(meta?.academic_year?.starts_on)}</dd></div>
                    <div><dt>Fin</dt><dd>{date(meta?.academic_year?.ends_on)}</dd></div>
                  </dl>
                </Card>
                <Card>
                  <CardHead title="Période de notation" sub="Trimestre actif" />
                  <dl className="dl">
                    <div><dt>Nom</dt><dd>{meta?.term?.name || '—'}</dd></div>
                    <div><dt>Début</dt><dd>{date(meta?.term?.starts_on)}</dd></div>
                    <div><dt>Fin</dt><dd>{date(meta?.term?.ends_on)}</dd></div>
                  </dl>
                </Card>
              </div>
            </div>
          )}

          {tab === 2 && (
            <Card>
              <CardHead
                title="Départements"
                sub="Regroupement des matières et des enseignants"
                right={<Btn icon="plus" solid onClick={() => actions.department()}>Nouveau département</Btn>}
              />
              <ListState
                loading={departments.loading && !departments.data}
                error={departments.error}
                empty={!departments.loading && !departments.error && !departmentRows.length}
                emptyTitle="Aucun département"
                emptySub="Créez un département pour organiser les matières."
                onRetry={departments.reload}
              >
                <Table
                  columns={['Département', 'Code', 'Matières', 'Personnel', '']}
                  template="1.6fr .7fr .8fr .8fr 34px"
                  foot={<><span className="tf-l">{departmentRows.length} départements</span><span className="tf-r">{departmentRows.reduce((sum, item) => sum + (item.subjects_count || 0), 0)} matières</span></>}
                >
                  {departmentRows.map((department) => (
                    <Tr key={department.id} template="1.6fr .7fr .8fr .8fr 34px">
                      <span className="cell subject-cell">
                        <i className="subj-dot tone-accent" />
                        <span><b>{department.name}</b><em>Département</em></span>
                      </span>
                      <span className="cell mono">{department.code || '—'}</span>
                      <span className="cell mono">{department.subjects_count || 0}</span>
                      <span className="cell mono">{department.staff_count || 0}</span>
                      <span className="cell right cell-actions">
                        <ActionMenu actions={[
                          { label: 'Modifier', icon: 'edit', onClick: () => actions.department(department) },
                          { label: 'Supprimer', icon: 'trash', tone: 'danger', onClick: () => actions.deleteDepartment(department) },
                        ]} />
                      </span>
                    </Tr>
                  ))}
                </Table>
              </ListState>
            </Card>
          )}

          {tab === 3 && (
            <div className="stack">
              <div className="stats-row">
                <div className="stat"><b>{feeRows.length}</b><span>Types de frais</span></div>
                <div className="stat"><b className="tone-accent">{compactMoney(feesTotal, currency)}</b><span>Somme des montants de référence</span></div>
                <div className="stat"><b>{feeRows.filter((fee) => fee.is_recurring).length}</b><span>Frais récurrents</span></div>
                <div className="stat"><b>{number(feeRows.reduce((sum, fee) => sum + (fee.invoices_count || 0), 0))}</b><span>Factures générées</span></div>
              </div>

              <Card>
                <CardHead
                  title="Grille tarifaire"
                  sub="Frais proposés lors de la facturation"
                  right={<Btn icon="plus" solid onClick={() => actions.feeType()}>Nouveau type de frais</Btn>}
                />
                <ListState
                  loading={feeTypes.loading && !feeTypes.data}
                  error={feeTypes.error}
                  empty={!feeTypes.loading && !feeTypes.error && !feeRows.length}
                  emptyTitle="Aucun type de frais"
                  emptySub="Créez les frais de scolarité, cantine ou transport."
                  onRetry={feeTypes.reload}
                >
                  <Table
                    columns={['Libellé', 'Code', 'Montant', 'Récurrent', 'Factures', 'Statut', '']}
                    template="1.6fr .7fr 1fr .8fr .7fr .8fr 34px"
                  >
                    {feeRows.map((fee) => (
                      <Tr key={fee.id} template="1.6fr .7fr 1fr .8fr .7fr .8fr 34px">
                        <span className="cell"><b className="cell-title">{fee.name}</b><em className="cell-sub">Frais {fee.is_recurring ? 'périodique' : 'ponctuel'}</em></span>
                        <span className="cell mono">{fee.code}</span>
                        <span className="cell mono">{money(fee.default_amount, currency)}</span>
                        <span className="cell">{fee.is_recurring ? <Pill tone="copper">Récurrent</Pill> : <Pill tone="muted">Ponctuel</Pill>}</span>
                        <span className="cell mono">{number(fee.invoices_count)}</span>
                        <span className="cell">{fee.is_active ? <Pill tone="accent">Actif</Pill> : <Pill tone="danger">Inactif</Pill>}</span>
                        <span className="cell right cell-actions">
                          <ActionMenu actions={[
                            { label: 'Modifier', icon: 'edit', onClick: () => actions.feeType(fee) },
                            { label: 'Supprimer', icon: 'trash', tone: 'danger', onClick: () => actions.deleteFeeType(fee) },
                          ]} />
                        </span>
                      </Tr>
                    ))}
                  </Table>
                </ListState>
              </Card>
            </div>
          )}

          {tab === 4 && (
            <div className="stack">
              <div className="stats-row">
                <div className="stat"><b>{userRows.length}</b><span>Comptes utilisateurs</span></div>
                {ROLES.map((role) => (
                  <div className="stat" key={role}>
                    <b>{userRows.filter((account) => account.role === role).length}</b>
                    <span>{ROLE_LABELS[role]}</span>
                  </div>
                ))}
              </div>

              <Card>
                <CardHead
                  title="Comptes et accès"
                  sub="Créez les accès du personnel et ajustez leurs responsabilités."
                  right={<Btn icon="userPlus" solid onClick={() => actions.user()}>Nouveau compte</Btn>}
                />
                <ListState
                  loading={users.loading && !users.data}
                  error={users.error}
                  empty={!users.loading && !users.error && !userRows.length}
                  emptyTitle="Aucun compte"
                  emptySub="Créez un premier compte pour permettre la connexion."
                  onRetry={users.reload}
                >
                  <Table
                    columns={['Utilisateur', 'Adresse e-mail', 'Rôle', 'Créé le', '']}
                    template="1.4fr 1.7fr .8fr .8fr 34px"
                    foot={<><span className="tf-l">{userRows.length} comptes</span><span className="tf-r">Accès protégés par token</span></>}
                  >
                    {userRows.map((account) => (
                      <Tr key={account.id} template="1.4fr 1.7fr .8fr .8fr 34px">
                        <span className="cell subject-cell">
                          <Avatar initials={initials(account.name)} size={26} />
                          <span>
                            <b>{account.name}</b>
                            <em>{account.id === user?.id ? 'Votre compte' : 'Compte actif'}</em>
                          </span>
                        </span>
                        <span className="cell mono">{account.email}</span>
                        <span className="cell">
                          <Pill tone={ROLE_TONES[account.role] || 'muted'}>{ROLE_LABELS[account.role] || account.role}</Pill>
                        </span>
                        <span className="cell mono">{date(account.created_at)}</span>
                        <span className="cell right cell-actions">
                          <ActionMenu actions={[
                            { label: 'Modifier le compte', icon: 'edit', onClick: () => actions.user(account) },
                            account.id !== user?.id && {
                              label: 'Supprimer',
                              icon: 'trash',
                              tone: 'danger',
                              onClick: () => actions.deleteUser(account),
                            },
                          ]} />
                        </span>
                      </Tr>
                    ))}
                  </Table>
                </ListState>
              </Card>

              <Card>
                <CardHead title="Rôles et responsabilités" sub="Référentiel appliqué à l’interface et à l’API." />
                <div className="role-grid">
                  {ROLES.map((role) => (
                    <div className={`role-card role-${role}`} key={role}>
                      <span className="role-card-dot" />
                      <b>{ROLE_LABELS[role]}</b>
                      <em>{ROLE_DESCRIPTIONS[role]}</em>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {tab === 5 && (
            <div className="stack">
              <Card>
                <CardHead title="Confort d’affichage" sub="Préférences enregistrées sur cet appareil" />
                <div className="pref-list">
                  <div className="pref-row">
                    <span className="pref-ic"><Icon name="play" size={15} /></span>
                    <span className="pref-main">
                      <b>Réduire les animations</b>
                      <em>Désactive les transitions et les effets de mouvement.</em>
                    </span>
                    <Toggle on={prefs.reduceMotion} onChange={(value) => setPrefs((current) => ({ ...current, reduceMotion: value }))} label="Réduire les animations" />
                  </div>
                  <div className="pref-row">
                    <span className="pref-ic"><Icon name="classes" size={15} /></span>
                    <span className="pref-main">
                      <b>Interface compacte</b>
                      <em>Réduit les espacements pour afficher davantage de données.</em>
                    </span>
                    <Toggle on={prefs.compact} onChange={(value) => setPrefs((current) => ({ ...current, compact: value }))} label="Interface compacte" />
                  </div>
                </div>
                <div className="form-footer">
                  <span className="form-hint">Ces préférences restent locales à cet appareil.</span>
                  <div className="form-actions">
                    <Btn icon="refresh" onClick={resetPrefs}>Réinitialiser</Btn>
                  </div>
                </div>
              </Card>

              <div className="settings-cards two">
                <Card>
                  <CardHead title="Session" sub="Compte utilisé par l’application" right={apiPill} />
                  <div className="session-user">
                    <Avatar
                      initials={initials(user?.name || 'Utilisateur')}
                      size={44}
                      src={user?.photo_url}
                      alt={user?.name || 'Photo de profil'}
                    />
                    <div>
                      <b>{user?.name || 'Utilisateur'}</b>
                      <span className="mono">{user?.email || '—'}</span>
                    </div>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => avatarInput.current?.click()}
                      disabled={uploadingAvatar}
                    >
                      {uploadingAvatar ? <span className="spinner" /> : <Icon name="upload" size={14} />}
                      {uploadingAvatar ? 'Envoi…' : 'Photo'}
                    </button>
                    <input
                      ref={avatarInput}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      hidden
                      onChange={uploadAvatar}
                    />
                  </div>
                  <dl className="dl">
                    <div><dt>Utilisateur</dt><dd>{user?.name || '—'}</dd></div>
                    <div><dt>Adresse</dt><dd className="mono">{user?.email || '—'}</dd></div>
                    <div><dt>Jeton</dt><dd className="mono">{getToken() ? 'Actif' : 'Non connecté'}</dd></div>
                    <div><dt>Dernière vérification</dt><dd>{health.data?.time ? date(health.data.time) : '—'}</dd></div>
                  </dl>
                  <div className="mini-actions">
                    <Btn icon="refresh" onClick={testConnection}>{testing ? 'Test en cours…' : 'Tester la connexion'}</Btn>
                  </div>
                </Card>

                <Card>
                  <CardHead title="API Kalanso" sub="Service Laravel · Sanctum" />
                  <dl className="dl">
                    <div><dt>URL</dt><dd className="mono">{API_URL}</dd></div>
                    <div><dt>État</dt><dd>{health.loading ? 'Vérification…' : health.error ? 'Indisponible' : 'Opérationnelle'}</dd></div>
                    <div><dt>Démarrage</dt><dd>{booting ? 'En cours' : 'Terminé'}</dd></div>
                    <div><dt>Écritures</dt><dd>Protégées par token</dd></div>
                  </dl>
                  <div className="api-hint">
                    <Icon name="external" size={13} />
                    <span>Lancez <code>php artisan serve --host=127.0.0.1 --port=8001</code> dans le dossier <code>api</code>.</span>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
