import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRightIcon as ArrowRight, ShieldCheckIcon as ShieldCheck, MonitorSmartphoneIcon as MonitorSmartphone, UsersIcon as Users, LockIcon as Lock, MailIcon as Mail, GraduationCapIcon as GraduationCap, ArrowLeftIcon as ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/Auth.jsx';
import { school, staffAccounts } from '../data/content.js';

const PROFILES = [
  { id: 'personnel', label: 'Personnel', desc: 'Direction, scolarité, formateurs', icon: MonitorSmartphone },
  { id: 'etudiant', label: 'Étudiant', desc: 'Notes, cours, scolarité', icon: GraduationCap },
  { id: 'parent', label: 'Parent', desc: 'Suivi de mon enfant', icon: Users },
];

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [profile, setProfile] = useState(params.get('profil') === 'personnel' ? 'personnel' : 'etudiant');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={user.profile === 'personnel' ? '/personnel' : '/espace'} replace />;

  const submit = (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = login({ email, password, profile });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    navigate(res.profile === 'personnel' ? '/personnel' : '/espace', { replace: true });
  };

  const fillDemo = (a) => {
    setProfile('personnel');
    setEmail(a.email);
    setPassword(a.password);
    setError('');
  };

  return (
    <div className="auth-wrap">
      <div className="auth-visual">
        <img src="/img/hero.jpg" alt="Étudiants de l’IPFS-BK" />
        <div>
          <span className="chip glass" style={{ justifySelf: 'start' }}><ShieldCheck size={13} /> Espace sécurisé IPFS-BK</span>
          <h2 className="display-md" style={{ color: '#fff' }}>
            Le personnel accède directement à la <span style={{ fontStyle: 'italic', color: 'var(--gold-2)' }}>version PC</span>.
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: '0.94rem' }}>
            Étudiants, parents et personnel disposent chacun de leur espace. Dès qu’un membre du personnel se
            connecte, le site bascule sur l’interface de bureau complète.
          </p>
          <div style={{ display: 'flex', gap: 18, marginTop: 6, flexWrap: 'wrap' }}>
            {[['4', 'profils'], ['1', 'plateforme'], ['24/7', 'accès']].map(([k, v]) => (
              <div key={v}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: '#fff' }}>{k}</div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-form-wrap">
        <div className="auth-card">
          <Link to="/" className="link-arrow" style={{ color: 'rgba(4,19,15,0.5)', fontSize: '0.82rem' }}>
            <ArrowLeft size={15} /> Retour au site
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="brand-mark">BK</span>
            <div className="brand-text">
              <strong>Bernard Kouchner</strong>
              <span>{school.shortName} · Hippodrome 1</span>
            </div>
          </div>

          <div>
            <h1>Connexion à votre espace</h1>
            <p style={{ fontSize: '0.88rem', color: 'rgba(4,19,15,0.55)', marginTop: 6 }}>
              Sélectionnez votre profil, puis identifiez-vous avec les accès remis par la scolarité.
            </p>
          </div>

          <div style={{ display: 'grid', gap: 8 }}>
            {PROFILES.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`choice-card ${profile === p.id ? 'on' : ''}`}
                onClick={() => { setProfile(p.id); setError(''); }}
              >
                <span className="radio-dot" />
                <span style={{ width: 34, height: 34, borderRadius: 10, background: profile === p.id ? 'rgba(15,111,82,0.14)' : 'var(--cream-2)', color: 'var(--emerald)', display: 'grid', placeItems: 'center', flex: 'none' }}>
                  <p.icon size={16} />
                </span>
                <span style={{ flex: 1 }}>
                  <b>{p.label}</b>
                  <small>{p.desc}</small>
                </span>
                {p.id === 'personnel' && <span className="chip emerald" style={{ fontSize: '0.62rem' }}>Version PC</span>}
              </button>
            ))}
          </div>

          <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
            <div className="field">
              <label htmlFor="l-email">Adresse e-mail</label>
              <label className="search-box" style={{ padding: '11px 14px' }}>
                <Mail size={15} />
                <input id="l-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@ipfs-bk.ml" autoComplete="username" required />
              </label>
            </div>
            <div className="field">
              <label htmlFor="l-pass">Mot de passe</label>
              <label className="search-box" style={{ padding: '11px 14px' }}>
                <Lock size={15} />
                <input id="l-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" required />
              </label>
            </div>
            {error && <span className="error-text">{error}</span>}
            <button className="btn btn-primary btn-lg" type="submit" disabled={busy}>
              {busy ? 'Connexion…' : profile === 'personnel' ? 'Accéder à la version PC' : 'Se connecter'}
              <ArrowRight className="arrow" />
            </button>
          </form>

          {profile === 'personnel' && (
            <div className="auth-hint">
              <b style={{ fontSize: '0.76rem' }}>Accès de démonstration — personnel</b>
              {staffAccounts.map((a) => (
                <button
                  key={a.email}
                  type="button"
                  onClick={() => fillDemo(a)}
                  style={{ textAlign: 'left', fontSize: '0.75rem', color: '#6d5318', textDecoration: 'underline', textUnderlineOffset: 3 }}
                >
                  {a.role} : <code>{a.email}</code> · <code>{a.password}</code>
                </button>
              ))}
            </div>
          )}

          <div className="auth-split">ou</div>
          <div style={{ display: 'grid', gap: 10 }}>
            <Link to="/application" className="btn btn-ghost">Télécharger l’application mobile</Link>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', fontSize: '0.75rem', color: 'rgba(4,19,15,0.45)' }}>
              <Link to="/admission" style={{ color: 'var(--emerald)', fontWeight: 700 }}>Pas encore inscrit ?</Link>
              <span>·</span>
              <Link to="/contact">Besoin d’aide</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
