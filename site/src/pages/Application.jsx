import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheckIcon as CalendarCheck, ClipboardListIcon as ClipboardList, WalletIcon as Wallet, MessageSquareIcon as MessageSquare, BellRingIcon as BellRing, FingerprintIcon as Fingerprint, SmartphoneIcon as Smartphone, Apple, PlayIcon as Play, ArrowRightIcon as ArrowRight, CheckIcon as Check, QrCodeIcon as QrCode, ShieldCheckIcon as ShieldCheck, DownloadIcon as Download, MonitorSmartphoneIcon as MonitorSmartphone, SparklesIcon as Sparkles, WifiIcon as Wifi, BatteryFull, SignalIcon as Signal, BookOpenIcon as BookOpen, UserIcon as User, HomeIcon as Home } from 'lucide-react';
import QRCode from 'qrcode';
import Reveal, { Breadcrumb, useToast } from '../components/Reveal.jsx';
import { mobileFeatures, mobileScreens, school } from '../data/content.js';

const ICONS = { CalendarCheck, ClipboardList, Wallet, MessageSquare, BellRing, Fingerprint };

export default function Application() {
  const [qr, setQr] = useState('');
  const { show, node } = useToast();
  const [screen, setScreen] = useState(0);

  useEffect(() => {
    QRCode.toDataURL(`${window.location.origin}/application`, {
      margin: 0,
      width: 220,
      color: { dark: '#04130f', light: '#ffffff' },
    })
      .then(setQr)
      .catch(() => setQr(''));
  }, []);

  return (
    <>
      <section className="page-hero band-dark noise">
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div className="breadcrumb" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <Link to="/">Accueil</Link><span>/</span><span style={{ color: '#fff' }}>Application mobile</span>
          </div>
          <div className="split" style={{ alignItems: 'center', paddingTop: 14 }}>
            <div style={{ display: 'grid', gap: 18 }}>
              <span className="eyebrow">L’application IPFS-BK · iOS & Android</span>
              <h1 className="display-lg" style={{ color: '#fff' }}>
                Votre institut, <span style={{ fontStyle: 'italic', color: 'var(--gold-2)' }}>dans votre poche</span>.
              </h1>
              <p className="lead" style={{ color: 'rgba(255,255,255,0.7)', maxWidth: '48ch' }}>
                L’application officielle de l’Institut Bernard Kouchner réunit l’emploi du temps, les notes, les
                bulletins, la scolarité, les paiements BNDA et la messagerie dans une expérience rapide, lisible et
                sécurisée — pensée pour les connexions mobiles du Mali.
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <span className="chip glass"><Wifi size={12} /> Mode économie de données</span>
                <span className="chip glass"><ShieldCheck size={12} /> Connexion sécurisée</span>
                <span className="chip glass"><Sparkles size={12} /> Interface en français</span>
              </div>
              <div className="app-cta-grid" style={{ maxWidth: 430 }}>
                <a href="#telecharger" className="app-store"><Apple /> <span><small>Télécharger sur</small><b>App Store</b></span></a>
                <a href="#telecharger" className="app-store"><Play /> <span><small>Disponible sur</small><b>Google Play</b></span></a>
              </div>
            </div>
            <div className="phones-stage">
              <div style={{ transform: 'rotate(-4deg) translateX(26px)', opacity: 0.72, transformOrigin: 'bottom right' }}>
                <PhoneMini />
              </div>
              <div className="phone-float" style={{ transform: 'translateX(-26px)', zIndex: 2 }}>
                <PhoneScreens index={screen} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Écrans */}
      <section className="section-sm">
        <div className="container">
          <div className="section-head">
            <div className="titles">
              <span className="eyebrow">Aperçu</span>
              <h2 className="display-md">Quatre écrans, tout votre parcours</h2>
            </div>
            <div className="filter-row">
              {mobileScreens.map((s, i) => (
                <button key={s.titre} className={`seg ${screen === i ? 'on' : ''}`} onClick={() => setScreen(i)}>
                  {s.titre}
                </button>
              ))}
            </div>
          </div>
          <div className="grid-4">
            {mobileScreens.map((s, i) => (
              <Reveal key={s.titre} delay={i * 70}>
                <button
                  onClick={() => setScreen(i)}
                  className="card"
                  style={{
                    padding: 16, display: 'grid', gap: 12, textAlign: 'left', width: '100%',
                    borderColor: screen === i ? 'var(--emerald)' : undefined,
                    boxShadow: screen === i ? '0 0 0 3px rgba(15,111,82,0.14), var(--shadow-sm)' : undefined,
                  }}
                >
                  <div style={{ borderRadius: 14, overflow: 'hidden', background: 'var(--cream-2)' }}>
                    <img src={['/img/hero.jpg', '/img/lab.jpg', '/img/care.jpg', '/img/team-3.jpg'][i]} alt={s.titre} style={{ width: '100%', aspectRatio: '16/11', objectFit: 'cover' }} />
                  </div>
                  <div>
                    <b style={{ fontSize: '0.9rem' }}>{s.titre}</b>
                    <div style={{ fontSize: '0.76rem', color: 'rgba(4,19,15,0.5)' }}>{s.detail}</div>
                  </div>
                </button>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Fonctionnalités */}
      <section className="section" style={{ background: 'var(--cream-2)' }}>
        <div className="container">
          <div className="section-head">
            <div className="titles">
              <span className="eyebrow">Fonctionnalités</span>
              <h2 className="display-md">Tout ce dont un étudiant a besoin</h2>
              <p className="lead">Conçue avec les équipes pédagogiques et la Direction des études de l’IPFS-BK.</p>
            </div>
          </div>
          <div className="grid-3">
            {mobileFeatures.map((f, i) => {
              const Icon = ICONS[f.icon] || CalendarCheck;
              return (
                <Reveal key={f.titre} delay={i * 70} className="card value-card">
                  <div className="value-icon"><Icon /></div>
                  <h3>{f.titre}</h3>
                  <p>{f.texte}</p>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Personnel : version PC */}
      <section className="section">
        <div className="container">
          <Reveal className="card" style={{ padding: 'clamp(24px,4vw,44px)', display: 'grid', gridTemplateColumns: '1fr auto', gap: 32, alignItems: 'center' }}>
            <div style={{ display: 'grid', gap: 14 }}>
              <span className="eyebrow">Espace personnel</span>
              <h2 className="display-md">
                Vous êtes membre du personnel ? <span className="italic-accent">Connectez-vous</span> pour accéder à la version PC.
              </h2>
              <p className="lead" style={{ maxWidth: '60ch' }}>
                Dès qu’un membre du personnel de l’institut se connecte, le site bascule automatiquement sur
                l’interface de bureau : tableau de bord, élèves, classes, notes, scolarité, admissions et messagerie
                — une vraie application de gestion, optimisée pour grand écran.
              </p>
              <ul className="check-list" style={{ gridTemplateColumns: '1fr 1fr', display: 'grid' }}>
                {['Tableau de bord temps réel', 'Gestion des élèves & classes', 'Notes, absences et bulletins', 'Scolarité & reçus BNDA'].map((x) => (
                  <li key={x}><span className="tick"><Check /></span>{x}</li>
                ))}
              </ul>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 6 }}>
                <Link to="/espace?profil=personnel" className="btn btn-primary btn-lg">
                  <MonitorSmartphone /> Accéder à la version PC
                </Link>
                <Link to="/espace" className="btn btn-ghost btn-lg">Espace étudiant / parent</Link>
              </div>
            </div>
            <div style={{ display: 'grid', gap: 10, justifyItems: 'center' }}>
              <div className="qr-wrap" style={{ display: 'grid', justifyItems: 'center', gap: 10, padding: 18 }}>
                {qr ? <img src={qr} alt="QR code vers l’application IPFS-BK" /> : <QrCode size={78} />}
                <div style={{ textAlign: 'center' }}>
                  <b>Scanner pour installer</b>
                  <small>Ouvrez l’app sur mobile</small>
                </div>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'rgba(4,19,15,0.45)' }}>Version 1.0 · 42 Mo · Gratuit</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Télécharger */}
      <section className="section-sm band-dark noise" id="telecharger">
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div className="split">
            <Reveal style={{ display: 'grid', gap: 16 }}>
              <span className="eyebrow">Téléchargement</span>
              <h2 className="display-md" style={{ color: '#fff' }}>Installez l’application dès aujourd’hui</h2>
              <p className="lead" style={{ color: 'rgba(255,255,255,0.68)', maxWidth: '48ch' }}>
                Disponible gratuitement pour les étudiants, les parents et le personnel de l’Institut Bernard
                Kouchner. Une connexion internet ponctuelle suffit : vos données restent accessibles hors ligne.
              </p>
              <div className="app-cta-grid" style={{ maxWidth: 430 }}>
                <a href="#telecharger" className="app-store" onClick={(e) => { e.preventDefault(); show('Lien App Store bientôt disponible'); }}>
                  <Apple /> <span><small>Télécharger sur</small><b>App Store</b></span>
                </a>
                <a href="#telecharger" className="app-store" onClick={(e) => { e.preventDefault(); show('Lien Google Play bientôt disponible'); }}>
                  <Play /> <span><small>Disponible sur</small><b>Google Play</b></span>
                </a>
              </div>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 8 }}>
                {[{ k: '4,8/5', v: 'Note des étudiants' }, { k: '+1 200', v: 'Téléchargements' }, { k: 'FR', v: 'Langue de l’interface' }].map((s) => (
                  <div key={s.k}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: '#fff' }}>{s.k}</div>
                    <div style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.5)' }}>{s.v}</div>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={120} className="card" style={{ padding: 'clamp(20px,3vw,30px)', background: 'rgba(255,255,255,0.96)' }}>
              <div style={{ display: 'grid', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ width: 46, height: 46, borderRadius: 13, background: 'var(--ink)', display: 'grid', placeItems: 'center' }}>
                    <Download size={20} color="#f0d9a7" />
                  </span>
                  <div>
                    <b style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem' }}>Installation en 3 étapes</b>
                    <div style={{ fontSize: '0.76rem', color: 'rgba(4,19,15,0.5)' }}>Android · iOS</div>
                  </div>
                </div>
                {[
                  ['1', 'Téléchargez l’application', 'Depuis le store ou via le QR code.'],
                  ['2', 'Créez votre accès', 'Utilisez votre e-mail étudiant ou vos identifiants remis par la scolarité.'],
                  ['3', 'Connectez-vous', 'Vos cours, notes et échéances se synchronisent automatiquement.'],
                ].map(([n, t, d]) => (
                  <div key={n} style={{ display: 'grid', gridTemplateColumns: '26px 1fr', gap: 11, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
                    <span style={{ width: 24, height: 24, borderRadius: 99, background: 'var(--emerald)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: '0.72rem', fontWeight: 800 }}>{n}</span>
                    <div>
                      <b style={{ fontSize: '0.86rem' }}>{t}</b>
                      <p style={{ fontSize: '0.8rem', color: 'rgba(4,19,15,0.55)', marginTop: 2 }}>{d}</p>
                    </div>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '12px 14px', borderRadius: 12, background: 'rgba(15,111,82,0.07)', border: '1px solid rgba(15,111,82,0.16)' }}>
                  <ShieldCheck size={16} style={{ color: 'var(--emerald)', flex: 'none' }} />
                  <span style={{ fontSize: '0.76rem', color: 'rgba(4,19,15,0.65)' }}>
                    Besoin d’aide ? Appelez le {school.phones[0]} ou le {school.phones[1]}.
                  </span>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
      {node}
    </>
  );
}

function PhoneShell({ children }) {
  return (
    <div className="phone">
      <div className="phone-notch" />
      <div className="phone-screen">
        <div className="phone-status">
          <span>09:41</span>
          <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <Signal size={10} /> <Wifi size={10} /> <BatteryFull size={12} />
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}

function PhoneScreens({ index }) {
  const tabs = [Home, BookOpen, Wallet, MessageSquare];
  return (
    <PhoneShell>
      <div className="phone-content">
        <div className="phone-appbar">
          <span className="pa-logo">BK</span>
          <div>
            <b>{['Bonjour, Awa', 'Mes notes', 'Scolarité', 'Messages'][index]}</b>
            <small>{['Licence Kinésithérapie · L1', 'Semestre 1 · 2026—2027', 'Échéances & reçus', 'Scolarité · Formateurs'][index]}</small>
          </div>
          <span className="dot" style={{ marginLeft: 'auto' }} />
        </div>

        {index === 0 && (
          <>
            <div className="ph-hero">
              <small>Aujourd’hui · 23 novembre</small>
              <b>Rééducation fonctionnelle<br />08:00 — Amphi B</b>
              <div style={{ display: 'flex', gap: 6, marginTop: 9 }}>
                <span className="chip on-dark" style={{ fontSize: '0.55rem', padding: '3px 8px' }}>Salle B204</span>
                <span className="chip on-dark" style={{ fontSize: '0.55rem', padding: '3px 8px' }}>Pr. Traoré</span>
              </div>
            </div>
            <div className="ph-grid2">
              <div className="ph-mini"><small>Moyenne S1</small><b>15,4<span style={{ fontSize: '0.6em', color: 'var(--emerald)' }}>/20</span></b></div>
              <div className="ph-mini"><small>Scolarité</small><b>68<span style={{ fontSize: '0.6em', color: 'rgba(4,19,15,0.45)' }}>%</span></b><div className="ph-progress" style={{ marginTop: 5 }}><i style={{ width: '68%' }} /></div></div>
            </div>
            <div className="ph-card">
              <div className="ph-row">
                <span className="ph-icon"><CalendarCheck size={13} /></span>
                <div style={{ flex: 1 }}><div className="ph-label">Anatomie appliquée</div><div className="ph-sub">Demain · 10:00 · Amphi A</div></div>
              </div>
            </div>
            <div className="ph-card">
              <div className="ph-row">
                <span className="ph-icon"><BellRing size={13} /></span>
                <div style={{ flex: 1 }}><div className="ph-label">Convocation stage</div><div className="ph-sub">CHU Gabriel Touré · jeudi</div></div>
              </div>
            </div>
          </>
        )}

        {index === 1 && (
          <>
            <div className="ph-hero" style={{ background: 'linear-gradient(150deg,#0f6f52,#04130f)' }}>
              <small>Moyenne générale</small>
              <b>15,4 / 20</b>
              <div className="ph-progress" style={{ marginTop: 9, background: 'rgba(255,255,255,0.2)' }}><i style={{ width: '77%', background: '#f0d9a7' }} /></div>
            </div>
            {[['Anatomie appliquée', '16,5', 88], ['Biomécanique', '14,0', 72], ['Rééducation', '15,8', 80], ['Anglais médical', '13,5', 65]].map(([n, m, w]) => (
              <div className="ph-card" key={n}>
                <div className="ph-row" style={{ justifyContent: 'space-between' }}>
                  <span className="ph-label">{n}</span>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--emerald)' }}>{m}</span>
                </div>
                <div className="ph-progress" style={{ marginTop: 6 }}><i style={{ width: `${w}%` }} /></div>
              </div>
            ))}
            <div className="ph-card" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ClipboardList size={13} style={{ color: 'var(--emerald)' }} />
              <span className="ph-label" style={{ fontSize: '0.62rem' }}>Télécharger le bulletin S1</span>
            </div>
          </>
        )}

        {index === 2 && (
          <>
            <div className="ph-hero">
              <small>Total réglé</small>
              <b>290 000 / 450 000 FCFA</b>
              <div className="ph-progress" style={{ marginTop: 9, background: 'rgba(255,255,255,0.2)' }}><i style={{ width: '64%', background: '#f0d9a7' }} /></div>
            </div>
            {[['1ère échéance', '150 000 FCFA', 'Payé'], ['2ème échéance', '140 000 FCFA', 'Payé'], ['3ème échéance', '160 000 FCFA', 'À venir']].map(([t, m, s]) => (
              <div className="ph-card" key={t}>
                <div className="ph-row" style={{ justifyContent: 'space-between' }}>
                  <div>
                    <div className="ph-label">{t}</div>
                    <div className="ph-sub">BNDA 490001201401</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="ph-label">{m}</div>
                    <span style={{ fontSize: '0.55rem', fontWeight: 800, color: s === 'Payé' ? 'var(--emerald)' : '#8a6a24' }}>{s}</span>
                  </div>
                </div>
              </div>
            ))}
            <div className="ph-card" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Wallet size={13} style={{ color: 'var(--emerald)' }} />
              <span className="ph-label" style={{ fontSize: '0.62rem' }}>Télécharger les reçus</span>
            </div>
          </>
        )}

        {index === 3 && (
          <>
            {[['Scolarité', 'Votre reçu BNDA est disponible', '09:12'], ['Direction des études', 'Convocation stage jeudi 8h', 'hier'], ['Pr. Traoré', 'TP reporté à lundi prochain', 'lun'], ['Scolarité', 'Dossier complet — merci', '12 nov']].map(([n, m, t]) => (
              <div className="ph-card" key={n + m}>
                <div className="ph-row">
                  <span className="ph-icon"><User size={13} /></span>
                  <div style={{ flex: 1 }}>
                    <div className="ph-label">{n}</div>
                    <div className="ph-sub" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150 }}>{m}</div>
                  </div>
                  <span style={{ fontSize: '0.5rem', color: 'rgba(4,19,15,0.4)' }}>{t}</span>
                </div>
              </div>
            ))}
          </>
        )}

        <div className="ph-tabs">
          {tabs.map((T, i) => <T key={i} className={i === index ? 'on' : ''} />)}
        </div>
      </div>
    </PhoneShell>
  );
}

function PhoneMini() {
  return (
    <div className="phone" style={{ width: 226, opacity: 0.9 }}>
      <div className="phone-notch" style={{ width: 70 }} />
      <div className="phone-screen" style={{ height: 440 }}>
        <div className="phone-status"><span>09:41</span><span>5G</span></div>
        <div className="phone-content">
          <div className="phone-appbar">
            <span className="pa-logo">BK</span>
            <div><b>Emploi du temps</b><small>Semaine 34</small></div>
          </div>
          {[['Lun', 'Anatomie', '08:00'], ['Mar', 'Biomécanique', '10:00'], ['Mer', 'TP rééducation', '08:00'], ['Jeu', 'Stage CHU', '07:30'], ['Ven', 'Anglais médical', '14:00']].map(([d, t, h]) => (
            <div className="ph-card" key={d}>
              <div className="ph-row">
                <span style={{ width: 24, height: 24, borderRadius: 8, background: 'var(--mint)', color: 'var(--emerald)', display: 'grid', placeItems: 'center', fontSize: '0.5rem', fontWeight: 800 }}>{d}</span>
                <div style={{ flex: 1 }}>
                  <div className="ph-label">{t}</div>
                  <div className="ph-sub">{h} · Amphi B</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
