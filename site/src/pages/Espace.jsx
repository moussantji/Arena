import { Navigate, Link } from 'react-router-dom';
import { LogOutIcon as LogOut, ArrowLeftIcon as ArrowLeft, CalendarCheckIcon as CalendarCheck, ClipboardListIcon as ClipboardList, WalletIcon as Wallet, MessageSquareIcon as MessageSquare, BellRingIcon as BellRing, DownloadIcon as Download, ChevronRightIcon as ChevronRight, ArrowRightIcon as ArrowRight, HomeIcon as Home, BookOpenIcon as BookOpen, UserIcon as User, GraduationCapIcon as GraduationCap, CheckIcon as Check, SmartphoneIcon as Smartphone, ClockIcon as Clock, StethoscopeIcon as Stethoscope, FileTextIcon as FileText } from 'lucide-react';
import { useAuth } from '../context/Auth.jsx';
import { school, formations } from '../data/content.js';
import Reveal from '../components/Reveal.jsx';

const TABS = [
  { id: 'accueil', label: 'Accueil', icon: Home },
  { id: 'notes', label: 'Notes', icon: BookOpen },
  { id: 'scolarite', label: 'Scolarité', icon: Wallet },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
];

export default function Espace() {
  const { user, logout } = useAuth();

  if (!user) return <Navigate to="/espace/connexion" replace />;
  if (user.profile === 'personnel') return <Navigate to="/personnel" replace />;

  const isParent = user.profile === 'parent';

  return (
    <div style={{ background: '#f1f4f3', minHeight: '100svh', paddingTop: 0 }}>
      {/* Barre app */}
      <div style={{ background: 'var(--ink)', color: '#fff', paddingTop: 22, paddingBottom: 26 }}>
        <div className="container espace-head">
          <Link to="/" className="link-arrow" style={{ color: 'var(--gold-2)', width: '100%', fontSize: '0.8rem', marginBottom: 2 }}>
            <ArrowLeft size={14} /> Retour au site
          </Link>
          <span className="brand-mark" style={{ width: 48, height: 48 }}>BK</span>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold-2)', fontWeight: 800 }}>
              {isParent ? 'Espace parent' : 'Espace étudiant'}
            </div>
            <h1 style={{ color: '#fff', fontSize: 'clamp(1.3rem,2.4vw,1.8rem)' }}>Bonjour, {user.nom.split(' ')[0]}</h1>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
              {isParent ? 'Suivi de Awa Traoré · Kinésithérapie L1' : 'Licence Kinésithérapie · L1 · 2026—2027'}
            </div>
          </div>
          <div className="espace-actions">
            <Link to="/application" className="btn btn-light btn-sm"><Smartphone size={14} /> Application mobile</Link>
            <button className="btn btn-light btn-sm" onClick={logout}><LogOut size={14} /> Déconnexion</button>
          </div>
        </div>
      </div>

      <div className="container espace-wrap">
        <div className="kpis">
          {[
            { l: 'Moyenne S1', v: '15,4/20', d: 'Mention Très bien', i: GraduationCap },
            { l: 'Assiduité', v: '96 %', d: '2 absences justifiées', i: Check },
            { l: 'Scolarité', v: '64 %', d: '290 000 / 450 000 FCFA', i: Wallet },
            { l: 'Prochain cours', v: '08:00', d: 'Rééducation · Amphi B', i: CalendarCheck },
          ].map((k) => (
            <div className="kpi" key={k.l} style={{ background: '#fff' }}>
              <div className="kh"><span className="kl">{k.l}</span><k.i /></div>
              <b>{k.v}</b>
              <span style={{ fontSize: '0.72rem', color: 'rgba(4,19,15,0.5)' }}>{k.d}</span>
            </div>
          ))}
        </div>

        <div className="desk-cols">
          <div style={{ display: 'grid', gap: 16 }}>
            <div className="panel">
              <div className="panel-head"><b>Emploi du temps — cette semaine</b><span className="badge ok">Semaine 34</span></div>
              <div className="panel-body" style={{ display: 'grid', gap: 10 }}>
                {[
                  ['Lundi', '08:00', 'Anatomie appliquée', 'Amphi B'],
                  ['Mardi', '10:00', 'Biomécanique', 'Salle 204'],
                  ['Mercredi', '08:00', 'TP rééducation', 'Labo kiné'],
                  ['Jeudi', '07:30', 'Stage — CHU Gabriel Touré', 'Rééducation'],
                  ['Vendredi', '14:00', 'Anglais médical', 'Salle 108'],
                ].map(([j, h, c, s]) => (
                  <div
                    key={j + c}
                    className="schedule-row"
                    style={{ padding: '10px 12px', borderRadius: 11, background: 'var(--cream-2)' }}
                  >
                    <b className="sr-day">{j}</b>
                    <span className="sr-hour">{h}</span>
                    <span className="sr-course">{c}</span>
                    <small className="sr-room">{s}</small>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel">
              <div className="panel-head"><b>Mes notes — Semestre 1</b><button className="link-arrow">Bulletin PDF <Download size={13} /></button></div>
              <div className="panel-body" style={{ display: 'grid', gap: 12 }}>
                {[['Anatomie appliquée', 16.5], ['Biomécanique', 14.0], ['Techniques de rééducation', 15.8], ['Anglais médical', 13.5], ['Éthique professionnelle', 17.2]].map(([m, n]) => (
                  <div key={m}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 5 }}>
                      <span>{m}</span>
                      <b>{n.toFixed(1).replace('.', ',')} / 20</b>
                    </div>
                    <div style={{ height: 6, borderRadius: 9, background: 'rgba(4,19,15,0.08)', overflow: 'hidden' }}>
                      <i style={{ display: 'block', height: '100%', width: `${(n / 20) * 100}%`, borderRadius: 9, background: 'linear-gradient(90deg,var(--emerald),var(--jade))' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
            <div className="panel">
              <div className="panel-head"><b>Scolarité</b><span className="badge warn">2e échéance</span></div>
              <div className="panel-body" style={{ display: 'grid', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 6 }}>
                    <span style={{ color: 'rgba(4,19,15,0.55)' }}>Réglé</span>
                    <b>290 000 / 450 000 FCFA</b>
                  </div>
                  <div style={{ height: 8, borderRadius: 9, background: 'rgba(4,19,15,0.08)', overflow: 'hidden' }}>
                    <i style={{ display: 'block', height: '100%', width: '64%', borderRadius: 9, background: 'linear-gradient(90deg,var(--emerald),var(--jade))' }} />
                  </div>
                </div>
                {[['1ère échéance', '150 000', 'Payé'], ['2ème échéance', '140 000', 'Payé'], ['3ème échéance', '160 000', 'À venir']].map(([t, m, s]) => (
                  <div key={t} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 9, borderTop: '1px solid var(--line)', fontSize: '0.8rem' }}>
                    <div>
                      <b style={{ display: 'block' }}>{t}</b>
                      <small style={{ color: 'rgba(4,19,15,0.45)' }}>BNDA {school.bank.compte}</small>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <b>{m} FCFA</b>
                      <div><span className={`badge ${s === 'Payé' ? 'ok' : 'warn'}`}>{s}</span></div>
                    </div>
                  </div>
                ))}
                <button className="btn btn-primary btn-sm" style={{ width: '100%' }}><Download size={14} /> Télécharger les reçus</button>
              </div>
            </div>

            <div className="panel">
              <div className="panel-head"><b>Notifications</b><span className="badge ok">3 nouvelles</span></div>
              <div className="panel-body" style={{ display: 'grid', gap: 11 }}>
                {[
                  [BellRing, 'Convocation stage', 'CHU Gabriel Touré · jeudi 8h'],
                  [FileText, 'Reçu BNDA disponible', 'Versement du 04/11/2026'],
                  [Stethoscope, 'Nouvelle affectation', 'Service de rééducation · Pr. Traoré'],
                ].map(([Icon, t, d]) => (
                  <div key={t} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(15,111,82,0.09)', color: 'var(--emerald)', display: 'grid', placeItems: 'center', flex: 'none' }}>
                      <Icon size={14} />
                    </span>
                    <div>
                      <b style={{ fontSize: '0.82rem', display: 'block' }}>{t}</b>
                      <small style={{ fontSize: '0.74rem', color: 'rgba(4,19,15,0.48)' }}>{d}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel">
              <div className="panel-head"><b>{isParent ? 'Suivi parent' : 'Ma scolarité'}</b></div>
              <div className="panel-body" style={{ display: 'grid', gap: 10 }}>
                <p style={{ fontSize: '0.8rem', color: 'rgba(4,19,15,0.55)' }}>
                  {isParent
                    ? 'Retrouvez les absences, notes et échéances de votre enfant, mis à jour par la scolarité.'
                    : 'Retrouvez votre dossier, vos pièces justificatives et vos échéances de paiement.'}
                </p>
                <Link to="/contact" className="btn btn-ghost btn-sm" style={{ width: '100%' }}>Contacter la scolarité <ChevronRight size={14} /></Link>
              </div>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head"><b>Découvrir aussi</b><Link to="/formations" className="link-arrow">Toutes les formations <ArrowRight size={13} /></Link></div>
          <div className="panel-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))', gap: 12 }}>
            {formations.slice(0, 3).map((f) => (
              <Link key={f.slug} to={`/formations/${f.slug}`} style={{ display: 'flex', gap: 11, alignItems: 'center', padding: 11, borderRadius: 12, border: '1px solid var(--line)' }}>
                <img src={f.image} alt={f.titre} style={{ width: 52, height: 52, borderRadius: 9, objectFit: 'cover' }} />
                <div>
                  <b style={{ fontSize: '0.82rem', display: 'block', lineHeight: 1.3 }}>{f.titre}</b>
                  <small style={{ fontSize: '0.72rem', color: 'rgba(4,19,15,0.45)' }}>{f.niveau} · {f.tarif}</small>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div style={{ display: 'none' }}>
          {TABS.map((t) => <t.icon key={t.id} />)}
        </div>
      </div>
    </div>
  );
}
