import { useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { LayoutDashboardIcon as LayoutDashboard, UsersIcon as Users, GraduationCapIcon as GraduationCap, ClipboardListIcon as ClipboardList, WalletIcon as Wallet, CalendarDaysIcon as CalendarDays, MessageSquareIcon as MessageSquare, FileTextIcon as FileText, SettingsIcon as Settings, BellIcon as Bell, SearchIcon as Search, LogOutIcon as LogOut, ChevronRightIcon as ChevronRight, PlusIcon as Plus, TrendingUpIcon as TrendingUp, ArrowUpRightIcon as ArrowUpRight, CheckIcon as Check, AlertTriangleIcon as AlertTriangle, BookOpenIcon as BookOpen, UserPlusIcon as UserPlus, DownloadIcon as Download, PrinterIcon as Printer, ActivityIcon as Activity, Bed, StethoscopeIcon as Stethoscope, SparklesIcon as Sparkles, HomeIcon as Home, PieChartIcon as PieChart, ClockIcon as Clock } from 'lucide-react';
import { useAuth } from '../context/Auth.jsx';
import { school, formations } from '../data/content.js';

const NAV = [
  {
    grp: 'Pilotage',
    items: [
      { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
      { id: 'eleves', label: 'Élèves', icon: Users, badge: '248' },
      { id: 'classes', label: 'Classes & filières', icon: GraduationCap },
      { id: 'notes', label: 'Notes & bulletins', icon: ClipboardList },
    ],
  },
  {
    grp: 'Administration',
    items: [
      { id: 'scolarite', label: 'Scolarité', icon: Wallet },
      { id: 'absences', label: 'Absences', icon: Clock, badge: '6' },
      { id: 'emploi', label: 'Emploi du temps', icon: CalendarDays },
      { id: 'admissions', label: 'Admissions', icon: UserPlus, badge: '12' },
    ],
  },
  {
    grp: 'Communication',
    items: [
      { id: 'messages', label: 'Messagerie', icon: MessageSquare },
      { id: 'documents', label: 'Documents', icon: FileText },
      { id: 'parametres', label: 'Paramètres', icon: Settings },
    ],
  },
];

const ELEVES = [
  { nom: 'Awa Traoré', matricule: 'BK-2026-0141', filiere: 'Kinésithérapie', niveau: 'L1', statut: 'À jour', moyenne: 15.4 },
  { nom: 'Mamadou Diarra', matricule: 'BK-2026-0102', filiere: 'Infirmier d’État', niveau: 'L2', statut: 'À jour', moyenne: 14.1 },
  { nom: 'Fatoumata Coulibaly', matricule: 'BK-2026-0088', filiere: 'Sage-femme d’État', niveau: 'L1', statut: 'En retard', moyenne: 13.6 },
  { nom: 'Ibrahim Keïta', matricule: 'BK-2026-0075', filiere: 'Biologie Médicale', niveau: 'L2', statut: 'À jour', moyenne: 16.2 },
  { nom: 'Aminata Sissoko', matricule: 'BK-2026-0064', filiere: 'Nutrition Diététique', niveau: 'L3', statut: 'Bourse', moyenne: 15.9 },
  { nom: 'Seydou Touré', matricule: 'BK-2026-0051', filiere: 'Délégué Médical', niveau: 'LP', statut: 'À jour', moyenne: 15.1 },
  { nom: 'Rokia Sangaré', matricule: 'BK-2026-0043', filiere: 'Aide-soignant', niveau: 'A1', statut: 'En retard', moyenne: 12.8 },
  { nom: 'Oumar Cissé', matricule: 'BK-2026-0037', filiere: 'Infirmier en santé publique', niveau: 'L2', statut: 'À jour', moyenne: 14.7 },
];

const FILIERES = [
  { nom: 'Kinésithérapie', eleves: 42, classes: 2, taux: 94 },
  { nom: 'Infirmier d’État', eleves: 68, classes: 3, taux: 91 },
  { nom: 'Sage-femme d’État', eleves: 51, classes: 2, taux: 96 },
  { nom: 'Biologie Médicale', eleves: 34, classes: 2, taux: 88 },
  { nom: 'Nutrition Diététique', eleves: 27, classes: 1, taux: 85 },
  { nom: 'Délégué Médical', eleves: 26, classes: 1, taux: 97 },
];

export default function Desktop() {
  const { user, logout } = useAuth();
  const [active, setActive] = useState('dashboard');
  const [q, setQ] = useState('');

  if (!user) return <Navigate to="/espace?profil=personnel" replace />;
  if (user.profile !== 'personnel') return <Navigate to="/espace" replace />;

  const label = NAV.flatMap((g) => g.items).find((i) => i.id === active)?.label || 'Tableau de bord';

  return (
    <div className="desk">
      <aside className="desk-side">
        <div style={{ display: 'grid', gap: 16 }}>
          <Link to="/" className="brand">
            <span className="brand-mark">BK</span>
            <span className="brand-text">
              <strong>Bernard Kouchner</strong>
              <span>Espace personnel</span>
            </span>
          </Link>
          <div className="chip on-dark" style={{ justifySelf: 'start', fontSize: '0.62rem' }}>
            <span className="dot" /> Version PC · session active
          </div>
        </div>

        <nav className="desk-nav">
          {NAV.map((g) => (
            <div key={g.grp}>
              <div className="grp">{g.grp}</div>
              {g.items.map((i) => (
                <button key={i.id} className={active === i.id ? 'on' : ''} onClick={() => setActive(i.id)}>
                  <i.icon /> {i.label}
                  {i.badge && (
                    <span style={{ marginLeft: 'auto', fontSize: '0.64rem', fontWeight: 800, padding: '1px 6px', borderRadius: 99, background: active === i.id ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.1)' }}>
                      {i.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="desk-user">
          <span className="avatar-initials">{user.initiales}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <b>{user.nom}</b>
            <small style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.role}</small>
          </div>
          <button
            onClick={logout}
            title="Se déconnecter"
            style={{ color: 'rgba(255,255,255,0.55)', display: 'grid', placeItems: 'center', padding: 6, borderRadius: 9 }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <div className="desk-main">
        <header className="desk-top">
          <div className="dt-title">
            <b>{label}</b>
            <small>Année académique 2026 — 2027 · Semestre 1</small>
          </div>
          <div className="spacer" />
          <label className="search-box" style={{ maxWidth: 260, padding: '9px 14px' }}>
            <Search />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un élève…" aria-label="Rechercher" />
          </label>
          <button className="icon-btn" aria-label="Notifications" style={{ position: 'relative' }}>
            <Bell />
            <span style={{ position: 'absolute', top: 7, right: 8, width: 7, height: 7, borderRadius: 99, background: 'var(--emerald)' }} />
          </button>
          <Link to="/" className="btn btn-ghost btn-sm">Voir le site</Link>
        </header>

        <div className="desk-body">
          {active === 'dashboard' && <Dashboard q={q} />}
          {active === 'eleves' && <Eleves q={q} />}
          {active === 'classes' && <Classes />}
          {active === 'notes' && <Notes />}
          {active === 'scolarite' && <Scolarite />}
          {active === 'absences' && <Absences />}
          {active === 'emploi' && <Emploi />}
          {active === 'admissions' && <Admissions />}
          {active === 'messages' && <Messages />}
          {active === 'documents' && <Documents />}
          {active === 'parametres' && <Parametres user={user} />}
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- Vues ----------------------------- */

function Kpi({ label, value, delta, icon: Icon, neg }) {
  return (
    <div className="kpi">
      <div className="kh">
        <span className="kl">{label}</span>
        <Icon />
      </div>
      <b>{value}</b>
      {delta && <span className={`delta ${neg ? 'neg' : ''}`}>{delta}</span>}
    </div>
  );
}

function Dashboard({ q }) {
  const rows = ELEVES.filter((e) => e.nom.toLowerCase().includes(q.toLowerCase())).slice(0, 5);
  return (
    <>
      <div className="kpis">
        <Kpi label="Élèves inscrits" value="248" delta="+12 cette rentrée" icon={Users} />
        <Kpi label="Taux de présence" value="93,4 %" delta="+2,1 pts vs S2 2025" icon={Activity} />
        <Kpi label="Scolarité encaissée" value="38,4 M" delta="FCFA · 78 % de l’objectif" icon={Wallet} />
        <Kpi label="Dossiers en attente" value="12" delta="3 à relancer" icon={UserPlus} neg />
      </div>

      <div className="desk-cols">
        <div className="panel">
          <div className="panel-head">
            <b>Répartition par filière</b>
            <span className="badge info">6 filières actives</span>
          </div>
          <div className="panel-body">
            <div className="bars">
              {FILIERES.map((f) => (
                <div className="bar" key={f.nom}>
                  <small>{f.eleves}</small>
                  <i style={{ height: `${Math.round((f.eleves / 68) * 120)}px` }} />
                  <small style={{ fontSize: '0.56rem', height: 26, overflow: 'hidden' }}>{f.nom.split(' ')[0]}</small>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <b>Activité récente</b>
            <span className="badge ok">En direct</span>
          </div>
          <div className="panel-body">
            <div className="timeline">
              {[
                ['Nouvelle inscription validée', 'Awa Traoré · Kinésithérapie L1', Check],
                ['Paiement BNDA reçu', '150 000 FCFA · Mamadou Diarra', Wallet],
                ['Absence signalée', 'Rokia Sangaré · non justifiée', AlertTriangle],
                ['Notes publiées', 'Biologie médicale · S1', ClipboardList],
                ['Stage confirmé', 'CHU Gabriel Touré · 8 étudiants', Stethoscope],
              ].map(([t, d, Icon], i) => (
                <div className="tl-item" key={i}>
                  <span className="tl-dot"><Icon /></span>
                  <div>
                    <b>{t}</b>
                    <small>{d}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <b>Derniers élèves inscrits</b>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm"><Download size={14} /> Exporter</button>
            <button className="btn btn-primary btn-sm"><Plus size={14} /> Nouvel élève</button>
          </div>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr><th>Élève</th><th>Matricule</th><th>Filière</th><th>Niveau</th><th>Moyenne</th><th>Statut</th></tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.matricule}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <span className="avatar-initials" style={{ width: 30, height: 30, fontSize: '0.66rem' }}>{e.nom.split(' ').map((x) => x[0]).join('')}</span>
                      <b style={{ fontWeight: 700 }}>{e.nom}</b>
                    </div>
                  </td>
                  <td style={{ color: 'rgba(4,19,15,0.5)' }}>{e.matricule}</td>
                  <td>{e.filiere}</td>
                  <td>{e.niveau}</td>
                  <td><b>{e.moyenne.toFixed(1).replace('.', ',')}</b> / 20</td>
                  <td><span className={`badge ${e.statut === 'En retard' ? 'bad' : e.statut === 'Bourse' ? 'warn' : 'ok'}`}>{e.statut}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="desk-cols">
        <div className="panel">
          <div className="panel-head"><b>Scolarité — encaissements par mois</b><span className="badge ok">+14 %</span></div>
          <div className="panel-body">
            <div className="bars" style={{ height: 130 }}>
              {[32, 46, 58, 41, 63, 78, 54, 88, 72].map((h, i) => (
                <div className="bar" key={i}>
                  <i style={{ height: `${h}px` }} />
                  <small>{['Sep', 'Oct', 'Nov', 'Déc', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai'][i]}</small>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-head"><b>Prochains événements</b></div>
          <div className="panel-body" style={{ display: 'grid', gap: 12 }}>
            {[
              ['23 nov.', 'Rentrée licence kinésithérapie', 'Amphi principal'],
              ['28 nov.', 'Conseil pédagogique', 'Salle de réunion'],
              ['05 déc.', 'Début des stages S1', 'CHU Gabriel Touré'],
              ['08 mai', 'Certification 2026', 'Palais de la Culture'],
            ].map(([d, t, l]) => (
              <div key={t} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ minWidth: 52, textAlign: 'center', padding: '6px 0', borderRadius: 10, background: 'rgba(15,111,82,0.08)', color: 'var(--emerald)', fontSize: '0.72rem', fontWeight: 800 }}>{d}</span>
                <div>
                  <b style={{ fontSize: '0.84rem', display: 'block' }}>{t}</b>
                  <small style={{ fontSize: '0.72rem', color: 'rgba(4,19,15,0.48)' }}>{l}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function PageHead({ title, desc, cta }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
      <div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 500 }}>{title}</h2>
        <p style={{ fontSize: '0.84rem', color: 'rgba(4,19,15,0.5)', marginTop: 4 }}>{desc}</p>
      </div>
      {cta}
    </div>
  );
}

function Eleves({ q }) {
  const rows = ELEVES.filter((e) => `${e.nom} ${e.filiere} ${e.matricule}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHead
        title="Élèves"
        desc={`${rows.length} élève(s) affiché(s) · 248 inscrits sur l’année 2026—2027`}
        cta={<div style={{ display: 'flex', gap: 8 }}><button className="btn btn-ghost btn-sm"><Download size={14} /> Exporter CSV</button><button className="btn btn-primary btn-sm"><Plus size={14} /> Nouvel élève</button></div>}
      />
      <div className="panel">
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>Élève</th><th>Matricule</th><th>Filière</th><th>Niveau</th><th>Moyenne</th><th>Statut</th><th /></tr></thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.matricule}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <span className="avatar-initials" style={{ width: 30, height: 30, fontSize: '0.66rem' }}>{e.nom.split(' ').map((x) => x[0]).join('')}</span>
                      <b style={{ fontWeight: 700 }}>{e.nom}</b>
                    </div>
                  </td>
                  <td style={{ color: 'rgba(4,19,15,0.5)' }}>{e.matricule}</td>
                  <td>{e.filiere}</td>
                  <td>{e.niveau}</td>
                  <td><b>{e.moyenne.toFixed(1).replace('.', ',')}</b> / 20</td>
                  <td><span className={`badge ${e.statut === 'En retard' ? 'bad' : e.statut === 'Bourse' ? 'warn' : 'ok'}`}>{e.statut}</span></td>
                  <td><button className="link-arrow" style={{ fontSize: '0.76rem' }}>Ouvrir <ChevronRight size={13} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function Classes() {
  return (
    <>
      <PageHead title="Classes & filières" desc="6 filières, 11 classes, 248 élèves" cta={<button className="btn btn-primary btn-sm"><Plus size={14} /> Nouvelle classe</button>} />
      <div className="kpis" style={{ gridTemplateColumns: 'repeat(3, minmax(0,1fr))' }}>
        {FILIERES.slice(0, 3).map((f) => (
          <div className="kpi" key={f.nom}>
            <div className="kh"><span className="kl">{f.nom}</span><GraduationCap /></div>
            <b>{f.eleves} <span style={{ fontSize: '0.5em', color: 'rgba(4,19,15,0.4)' }}>élèves</span></b>
            <span className="delta">{f.classes} classes · {f.taux} % de présence</span>
          </div>
        ))}
      </div>
      <div className="panel">
        <div className="panel-head"><b>Toutes les filières</b><span className="badge info">Rentrée 2026</span></div>
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>Filière</th><th>Classes</th><th>Élèves</th><th>Taux de présence</th><th>Progression</th></tr></thead>
            <tbody>
              {FILIERES.map((f) => (
                <tr key={f.nom}>
                  <td><b style={{ fontWeight: 700 }}>{f.nom}</b></td>
                  <td>{f.classes}</td>
                  <td>{f.eleves}</td>
                  <td><span className="badge ok">{f.taux} %</span></td>
                  <td style={{ minWidth: 160 }}>
                    <div style={{ height: 6, borderRadius: 9, background: 'rgba(4,19,15,0.08)', overflow: 'hidden' }}>
                      <i style={{ display: 'block', height: '100%', width: `${f.taux}%`, background: 'linear-gradient(90deg, var(--emerald), var(--jade))', borderRadius: 9 }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function Notes() {
  const matieres = [
    ['Anatomie appliquée', 16.5, 4],
    ['Biomécanique', 14.0, 3],
    ['Techniques de rééducation', 15.8, 3],
    ['Anglais médical', 13.5, 2],
    ['Éthique professionnelle', 17.2, 2],
  ];
  return (
    <>
      <PageHead
        title="Notes & bulletins"
        desc="Saisie des évaluations et génération des bulletins — Semestre 1"
        cta={<div style={{ display: 'flex', gap: 8 }}><button className="btn btn-ghost btn-sm"><Printer size={14} /> Imprimer</button><button className="btn btn-primary btn-sm"><Plus size={14} /> Nouvelle évaluation</button></div>}
      />
      <div className="desk-cols">
        <div className="panel">
          <div className="panel-head"><b>Kinésithérapie · L1</b><span className="badge ok">Publié</span></div>
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Matière</th><th>Crédits</th><th>Moyenne</th><th>Appréciation</th></tr></thead>
              <tbody>
                {matieres.map(([m, n, c]) => (
                  <tr key={m}>
                    <td><b style={{ fontWeight: 700 }}>{m}</b></td>
                    <td>{c}</td>
                    <td><b>{n.toFixed(1).replace('.', ',')}</b> / 20</td>
                    <td><span className={`badge ${n >= 16 ? 'ok' : n >= 14 ? 'ok' : 'warn'}`}>{n >= 16 ? 'Excellent' : n >= 14 ? 'Très bien' : 'Bien'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="panel">
          <div className="panel-head"><b>Synthèse</b></div>
          <div className="panel-body" style={{ display: 'grid', gap: 14 }}>
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{ fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(4,19,15,0.45)', fontWeight: 800 }}>Moyenne générale</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.6rem', lineHeight: 1.1 }}>15,4<span style={{ fontSize: '0.4em', color: 'rgba(4,19,15,0.4)' }}>/20</span></div>
              <span className="badge ok">Mention Très bien</span>
            </div>
            {[['Crédits validés', '14 / 14'], ['Rang', '3e sur 42'], ['Décision', 'Admis en S2']].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', paddingTop: 10, borderTop: '1px solid var(--line)' }}>
                <span style={{ color: 'rgba(4,19,15,0.5)' }}>{k}</span><b>{v}</b>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function Scolarite() {
  return (
    <>
      <PageHead title="Scolarité" desc="Suivi des paiements BNDA · 490001201401" cta={<button className="btn btn-primary btn-sm"><Plus size={14} /> Enregistrer un versement</button>} />
      <div className="kpis">
        <Kpi label="Attendu" value="49,2 M" delta="FCFA · année 2026—2027" icon={Wallet} />
        <Kpi label="Encaissé" value="38,4 M" delta="78 % de l’objectif" icon={TrendingUp} />
        <Kpi label="Reste à recouvrer" value="10,8 M" delta="22 % · 34 élèves" icon={AlertTriangle} neg />
        <Kpi label="Boursiers" value="13" delta="Mérite & engagement" icon={Sparkles} />
      </div>
      <div className="panel">
        <div className="panel-head"><b>Derniers versements</b><span className="badge ok">Compte BNDA</span></div>
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>Date</th><th>Élève</th><th>Filière</th><th>Montant</th><th>Mode</th><th>Statut</th></tr></thead>
            <tbody>
              {[
                ['04/11/2026', 'Awa Traoré', 'Kinésithérapie', '150 000', 'Virement', 'Validé'],
                ['03/11/2026', 'Mamadou Diarra', 'Infirmier d’État', '140 000', 'Versement', 'Validé'],
                ['02/11/2026', 'Ibrahim Keïta', 'Biologie Médicale', '205 000', 'Virement', 'Validé'],
                ['01/11/2026', 'Fatoumata Coulibaly', 'Sage-femme d’État', '145 000', 'Versement', 'En attente'],
                ['28/10/2026', 'Seydou Touré', 'Délégué Médical', '225 000', 'Virement', 'Validé'],
              ].map((r, i) => (
                <tr key={i}>
                  <td style={{ color: 'rgba(4,19,15,0.5)' }}>{r[0]}</td>
                  <td><b style={{ fontWeight: 700 }}>{r[1]}</b></td>
                  <td>{r[2]}</td>
                  <td><b>{r[3]} FCFA</b></td>
                  <td>{r[4]}</td>
                  <td><span className={`badge ${r[5] === 'Validé' ? 'ok' : 'warn'}`}>{r[5]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function Absences() {
  return (
    <>
      <PageHead title="Absences" desc="6 absences non justifiées à traiter cette semaine" cta={<button className="btn btn-primary btn-sm"><Check size={14} /> Justifier</button>} />
      <div className="panel">
        <div className="panel-head"><b>Registre de la semaine</b><span className="badge bad">6 non justifiées</span></div>
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>Élève</th><th>Filière</th><th>Date</th><th>Cours</th><th>Motif</th><th>Statut</th></tr></thead>
            <tbody>
              {[
                ['Rokia Sangaré', 'Aide-soignant', '05/11/2026', 'Hygiène hospitalière', '—', 'Non justifiée'],
                ['Fatoumata Coulibaly', 'Sage-femme d’État', '04/11/2026', 'Obstétrique', 'Certificat médical', 'Justifiée'],
                ['Oumar Cissé', 'Infirmier en santé publique', '04/11/2026', 'Santé communautaire', '—', 'Non justifiée'],
                ['Awa Traoré', 'Kinésithérapie', '03/11/2026', 'Biomécanique', 'Retard 20 min', 'Justifiée'],
              ].map((r, i) => (
                <tr key={i}>
                  <td><b style={{ fontWeight: 700 }}>{r[0]}</b></td>
                  <td>{r[1]}</td>
                  <td style={{ color: 'rgba(4,19,15,0.5)' }}>{r[2]}</td>
                  <td>{r[3]}</td>
                  <td style={{ color: 'rgba(4,19,15,0.55)' }}>{r[4]}</td>
                  <td><span className={`badge ${r[5] === 'Justifiée' ? 'ok' : 'bad'}`}>{r[5]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function Emploi() {
  const jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
  const slots = [
    ['Anatomie', 'Biomécanique', 'TP rééducation', 'Stage CHU', 'Anglais médical'],
    ['Physiologie', 'Rééducation', 'Anatomie', 'Stage CHU', 'Éthique'],
    ['TP labo', 'Nutrition', 'Biomécanique', 'Stage CHU', 'Communication'],
    ['Rééducation', 'TP labo', 'Physiologie', 'Stage CHU', 'Projet tutoré'],
  ];
  const heures = ['08:00', '10:00', '13:00', '15:00'];
  return (
    <>
      <PageHead title="Emploi du temps" desc="Kinésithérapie L1 · Semaine 34 · Amphi B" cta={<button className="btn btn-primary btn-sm"><Plus size={14} /> Ajouter un cours</button>} />
      <div className="panel">
        <div className="panel-head"><b>Semaine type</b><span className="badge info">8h — 17h</span></div>
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>Horaire</th>{jours.map((j) => <th key={j}>{j}</th>)}</tr></thead>
            <tbody>
              {slots.map((row, ri) => (
                <tr key={ri}>
                  <td style={{ color: 'rgba(4,19,15,0.5)', fontWeight: 700 }}>{heures[ri]}</td>
                  {row.map((c, ci) => (
                    <td key={ci}>
                      <div style={{ padding: '7px 10px', borderRadius: 9, background: ci === 3 ? 'rgba(217,178,106,0.16)' : 'rgba(15,111,82,0.07)', fontSize: '0.78rem', fontWeight: 600 }}>{c}</div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function Admissions() {
  return (
    <>
      <PageHead title="Admissions" desc="12 dossiers reçus via le formulaire en ligne" cta={<button className="btn btn-ghost btn-sm"><Download size={14} /> Exporter</button>} />
      <div className="panel">
        <div className="panel-head"><b>Dossiers récents</b><span className="badge warn">3 à relancer</span></div>
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>Candidat</th><th>Formation</th><th>Niveau</th><th>Reçu le</th><th>Pièces</th><th>Statut</th></tr></thead>
            <tbody>
              {[
                ['Aïssata Maïga', 'Kinésithérapie', 'BAC', '05/11/2026', '4 / 4', 'À l’étude'],
                ['Boubacar Diallo', 'Infirmier d’État', 'BAC', '04/11/2026', '3 / 4', 'À relancer'],
                ['Kadidia Sacko', 'Sage-femme d’État', 'BAC', '04/11/2026', '4 / 4', 'Validé'],
                ['Mahamadou Doumbia', 'Délégué Médical', 'BAC', '03/11/2026', '4 / 4', 'Validé'],
                ['Sitan Camara', 'Aide-soignant', 'DEF', '02/11/2026', '2 / 4', 'À relancer'],
              ].map((r, i) => (
                <tr key={i}>
                  <td><b style={{ fontWeight: 700 }}>{r[0]}</b></td>
                  <td>{r[1]}</td>
                  <td>{r[2]}</td>
                  <td style={{ color: 'rgba(4,19,15,0.5)' }}>{r[3]}</td>
                  <td>{r[4]}</td>
                  <td><span className={`badge ${r[5] === 'Validé' ? 'ok' : r[5] === 'À relancer' ? 'bad' : 'warn'}`}>{r[5]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function Messages() {
  return (
    <>
      <PageHead title="Messagerie" desc="4 conversations · réponses moyennes sous 2 h" cta={<button className="btn btn-primary btn-sm"><Plus size={14} /> Nouveau message</button>} />
      <div className="desk-cols">
        <div className="panel">
          <div className="panel-head"><b>Boîte de réception</b></div>
          <div className="panel-body" style={{ display: 'grid', gap: 6, padding: 10 }}>
            {[
              ['Direction des études', 'Convocation stage jeudi 8h', 'il y a 12 min', true],
              ['Awa Traoré', 'Question sur le bulletin S1', 'il y a 1 h', true],
              ['Binta Rose DEMBELE', 'Validation des échéanciers', 'hier', false],
              ['Pr. Traoré', 'TP reporté à lundi', 'hier', false],
              ['Scolarité', 'Reçus BNDA à imprimer', '12 nov.', false],
            ].map(([n, m, t, unread], i) => (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '11px 12px', borderRadius: 11, background: unread ? 'rgba(15,111,82,0.05)' : 'transparent' }}>
                <span className="avatar-initials" style={{ width: 32, height: 32, fontSize: '0.66rem' }}>{n.split(' ').map((x) => x[0]).join('').slice(0, 2)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                    <b style={{ fontSize: '0.84rem' }}>{n}</b>
                    <small style={{ fontSize: '0.68rem', color: 'rgba(4,19,15,0.42)', flex: 'none' }}>{t}</small>
                  </div>
                  <small style={{ fontSize: '0.78rem', color: 'rgba(4,19,15,0.5)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m}</small>
                </div>
                {unread && <span className="dot" style={{ marginTop: 10 }} />}
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="panel-head"><b>Direction des études</b><span className="badge ok">En ligne</span></div>
          <div className="panel-body" style={{ display: 'grid', gap: 12, alignContent: 'start', maxHeight: 380, overflowY: 'auto' }}>
            {[
              ['vous', 'Bonjour, la convocation de stage est-elle prête ?', false],
              ['them', 'Bonjour Bakary, oui — les 8 étudiants sont convoqués jeudi à 8h au CHU Gabriel Touré.', true],
              ['them', 'Le document est disponible dans « Documents » pour impression.', true],
              ['vous', 'Parfait, je le transmets aux délégués de classe.', false],
            ].map(([who, msg, other], i) => (
              <div key={i} style={{ justifySelf: other ? 'start' : 'end', maxWidth: '80%' }}>
                <div style={{ padding: '10px 13px', borderRadius: 13, fontSize: '0.83rem', background: other ? 'var(--cream-2)' : 'var(--emerald)', color: other ? 'var(--ink)' : '#fff' }}>{msg}</div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 12 }}>
              <input className="input" placeholder="Écrire un message…" style={{ flex: 1 }} />
              <button className="btn btn-primary">Envoyer</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Documents() {
  return (
    <>
      <PageHead title="Documents" desc="Bulletins, reçus et documents officiels" cta={<button className="btn btn-primary btn-sm"><Plus size={14} /> Ajouter</button>} />
      <div className="grid-3" style={{ gap: 14 }}>
        {[
          ['Bulletins S1', '248 documents générés', FileText],
          ['Reçus BNDA', '176 reçus', Wallet],
          ['Convocations stage', '8 convocations', Stethoscope],
          ['Attestations scolarité', '64 attestations', AwardIcon],
          ['Palmarès 2026', '1 document', Sparkles],
          ['Emplois du temps', '11 fichiers', CalendarDays],
        ].map(([t, d, Icon], i) => {
          const I = Icon || FileText;
          return (
            <div className="card" key={i} style={{ padding: 20, display: 'grid', gap: 9 }}>
              <span className="value-icon" style={{ width: 40, height: 40 }}><I size={18} /></span>
              <b style={{ fontSize: '0.9rem' }}>{t}</b>
              <small style={{ fontSize: '0.76rem', color: 'rgba(4,19,15,0.5)' }}>{d}</small>
              <button className="link-arrow" style={{ marginTop: 4 }}>Ouvrir <ArrowUpRight size={13} /></button>
            </div>
          );
        })}
      </div>
    </>
  );
}

function AwardIcon(props) {
  return <Sparkles {...props} />;
}

function Parametres({ user }) {
  return (
    <>
      <PageHead title="Paramètres" desc="Établissement, comptes et préférences" />
      <div className="desk-cols">
        <div className="panel">
          <div className="panel-head"><b>Établissement</b><span className="badge ok">Agréé MESRS</span></div>
          <div className="panel-body" style={{ display: 'grid', gap: 14 }}>
            {[
              ['Nom', school.name],
              ['Adresse', school.address],
              ['Téléphones', school.phones.join(' · ')],
              ['Compte bancaire', `BNDA ${school.bank.compte}`],
              ['Création', school.agrement.creation],
              ['Ouverture', school.agrement.ouverture],
            ].map(([k, v]) => (
              <div key={k} className="field">
                <label>{k}</label>
                <input className="input" defaultValue={v} readOnly />
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gap: 14 }}>
          <div className="panel">
            <div className="panel-head"><b>Votre compte</b></div>
            <div className="panel-body" style={{ display: 'grid', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                <span className="avatar-initials" style={{ width: 44, height: 44 }}>{user.initiales}</span>
                <div>
                  <b style={{ fontSize: '0.9rem', display: 'block' }}>{user.nom}</b>
                  <small style={{ fontSize: '0.76rem', color: 'rgba(4,19,15,0.5)' }}>{user.role}</small>
                </div>
              </div>
              <div className="field"><label>E-mail</label><input className="input" defaultValue={user.email} readOnly /></div>
              <button className="btn btn-ghost btn-sm">Changer le mot de passe</button>
            </div>
          </div>
          <div className="panel">
            <div className="panel-head"><b>Application mobile</b></div>
            <div className="panel-body" style={{ display: 'grid', gap: 10 }}>
              <p style={{ fontSize: '0.82rem', color: 'rgba(4,19,15,0.55)' }}>
                Invitez les étudiants à installer l’application IPFS-BK pour recevoir notes, absences et échéances.
              </p>
              <Link to="/application" className="btn btn-primary btn-sm">Voir la page application</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
