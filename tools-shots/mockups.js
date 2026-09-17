const IMG = '/home/user/Arena/palettes-ophtalmo/img';
const P = {
  1: {
    num: '01', nameA: 'Saphir', nameB: '& Ambre', mood: ['Précision', 'Confiance', 'Luxe sobre'],
    use: 'Palette de référence — interface de gestion & écran de réception',
    specs: ['RADIUS 14 PX', 'SIDEBAR 240 PX', 'BASE 14 PX'],
    bg: '#F3F6FB', surface: '#FFFFFF', s2: '#E9EFF8', border: '#D7E0EE',
    t1: '#0C1A30', t2: '#43536E', t3: '#8492AB',
    pri: '#1E56D6', priH: '#1744AC', priS: '#E2EAFC',
    acc: '#C08A2D', accS: '#F6ECDA',
    ok: '#1F8A58', okS: '#DFF3E8', warn: '#A86400', warnS: '#FAEDD7', err: '#C13B3B', errS: '#FAE4E4',
    side: '#0C1A30', sideTx: '#B9C7E0', ga: '#1E56D6', gb: '#4F86FF',
    accentName: 'Accent or', photo: IMG + '/bg-clinique-bleue.jpg',
  },
  2: {
    num: '02', nameA: 'Émeraude', nameB: '& Sable', mood: ['Apaisement', 'Nature', 'Prestige'],
    use: 'Espace patient & bilans — suivi cataracte / post-op',
    specs: ['RADIUS 14 PX', 'SIDEBAR 240 PX', 'BASE 14 PX'],
    bg: '#F5F3EC', surface: '#FFFFFF', s2: '#EFECE1', border: '#E0DBCB',
    t1: '#13251E', t2: '#48584F', t3: '#8A948C',
    pri: '#0F6B52', priH: '#0B5540', priS: '#DFF0E8',
    acc: '#B0702A', accS: '#F5E9D6',
    ok: '#2F7D4E', okS: '#E3F1E7', warn: '#A26605', warnS: '#F6EDD8', err: '#B23F2C', errS: '#F7E5E0',
    side: '#10221B', sideTx: '#B4C9BC', ga: '#0F6B52', gb: '#37A37F',
    accentName: 'Accent cuivre', photo: IMG + '/bg-clinique-emeraude.jpg',
  },
  3: {
    num: '03', nameA: 'Onyx', nameB: '& Iris', mood: ['Technologie', 'Nuit', 'Signature'],
    use: 'Mode sombre — imagerie OCT, fond d’œil & gardes',
    specs: ['RADIUS 12 PX', 'NAV GLASS', 'NIGHT MODE'],
    bg: '#0B0D13', surface: '#141824', s2: '#1C2130', border: '#272E42',
    t1: '#F1F3FA', t2: '#A7AEC6', t3: '#6E7592',
    pri: '#7B5CF6', priH: '#9377FF', priS: '#292349',
    acc: '#FF9E6D', accS: '#3B2B21',
    ok: '#34D399', okS: '#123227', warn: '#F5B62E', warnS: '#352B10', err: '#F0716B', errS: '#3A1E1E',
    side: '#0E1119', sideTx: '#9AA1BC', ga: '#7B5CF6', gb: '#B18CFF',
    accentName: 'Accent abricot', photo: IMG + '/bg-iris-sombre.jpg',
  },
};

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const chipW = (txt, fs) => Math.round(txt.length * fs * 0.66 + 26);

const ICONS = {
  eye: c => `<path d="M2.2 12S5.8 5.8 12 5.8 21.8 12 21.8 12 18.2 18.2 12 18.2 2.2 12 2.2 12Z"/><circle cx="12" cy="12" r="3.1"/>`,
  grid: () => `<rect x="3.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.8"/>`,
  door: c => `<rect x="5" y="3.5" width="14" height="17" rx="2.2"/><circle cx="15" cy="12" r="1.15" fill="${c}" stroke="none"/>`,
  cal: () => `<rect x="3.5" y="5" width="17" height="15.5" rx="2.4"/><path d="M3.5 10h17M8.5 3v4M15.5 3v4"/>`,
  users: () => `<circle cx="9.5" cy="8.5" r="3.4"/><path d="M3 19.5c.8-3.6 3.4-5.4 6.5-5.4s5.7 1.8 6.5 5.4M15.8 5.6a3.4 3.4 0 010 5.9M18.5 14.6c1.6.8 2.7 2.3 3.2 4.4"/>`,
  pulse: () => `<path d="M3 12h4l2.4-6 4.2 12 2.4-6H21"/>`,
  scan: () => `<path d="M4 8V5.8A1.8 1.8 0 015.8 4H8M16 4h2.2A1.8 1.8 0 0120 5.8V8M20 16v2.2a1.8 1.8 0 01-1.8 1.8H16M8 20H5.8A1.8 1.8 0 014 18.2V16"/><circle cx="12" cy="12" r="3.4"/>`,
  card: () => `<rect x="3" y="5.5" width="18" height="13.5" rx="2.4"/><path d="M3 10.5h18M6.8 15h4.5"/>`,
  box: () => `<rect x="3.5" y="7" width="17" height="13" rx="2.2"/><path d="M3.5 11.5h17M12 7v13M8 7l1.5-3h5L16 7"/>`,
  slid: c => `<path d="M4 7.5h16M4 12h16M4 16.5h16"/><circle cx="9.5" cy="7.5" r="2" fill="${c}" stroke="none"/><circle cx="15" cy="12" r="2" fill="${c}" stroke="none"/><circle cx="7.5" cy="16.5" r="2" fill="${c}" stroke="none"/>`,
  bell: () => `<path d="M6.2 9.2a5.8 5.8 0 0111.6 0c0 4.6 1.9 5.8 1.9 5.8H4.3s1.9-1.2 1.9-5.8M10 18.6a2.1 2.1 0 004 0"/>`,
  search: () => `<circle cx="11" cy="11" r="6.4"/><path d="M15.8 15.8L21 21"/>`,
  phone: () => `<path d="M5.5 4h3.4l1.6 4.1-2.1 1.6a12.6 12.6 0 005.9 5.9l1.6-2.1L20 15.1v3.4a2 2 0 01-2.2 2A16.9 16.9 0 013.5 6.2 2 2 0 015.5 4Z"/>`,
  chev: () => `<path d="M9.5 5.5l6.5 6.5-6.5 6.5"/>`,
  plus: () => `<path d="M12 5v14M5 12h14"/>`,
  msg: () => `<path d="M4 6.2A2.2 2.2 0 016.2 4h11.6A2.2 2.2 0 0120 6.2v8.6a2.2 2.2 0 01-2.2 2.2H9.4L4 21.2V6.2Z"/>`,
  chart: () => `<path d="M5 20v-9M12 20V4.5M19 20v-6.5"/>`,
  user: () => `<circle cx="12" cy="8" r="3.8"/><path d="M4.8 20c1-3.9 3.9-5.8 7.2-5.8s6.2 1.9 7.2 5.8"/>`,
  check: () => `<path d="M4.5 12.6l5 5L19.5 6.5"/>`,
  desktop: () => `<rect x="3" y="4.5" width="18" height="12.5" rx="2"/><path d="M9 20.5h6M12 17v3.5"/>`,
  mobile: () => `<rect x="7" y="3" width="10" height="18" rx="2.6"/><path d="M11 17.8h2"/>`,
  electron: c => `<ellipse cx="12" cy="12" rx="9.5" ry="4"/><ellipse cx="12" cy="12" rx="9.5" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9.5" ry="4" transform="rotate(-60 12 12)"/><circle cx="12" cy="12" r="1.8" fill="${c}" stroke="none"/>`,
  rn: c => `<circle cx="12" cy="12" r="1.9" fill="${c}" stroke="none"/><ellipse cx="12" cy="12" rx="10" ry="4.2"/><ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(-60 12 12)"/>`,
};
const I = (name, x, y, s, c, sw = 1.8) =>
  `<g transform="translate(${x} ${y}) scale(${(s / 24).toFixed(4)})" fill="none" stroke="${c}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${ICONS[name](c)}</g>`;

/* =====================================================================
   MOCKUP DESKTOP — PILOTAGE CLINIQUE (origine 0,0 — 880×720)
===================================================================== */
function deskMock(p, k) {
  const g = `g${k}`;
  const nav = [
    ['grid', 'Tableau de bord'], ['door', 'Réception', true], ['cal', 'Rendez-vous'], ['users', 'Patients'],
    ['pulse', 'Consultations'], ['scan', 'Imagerie OCT'], ['card', 'Facturation'], ['box', 'Stock matériel'],
    ['chart', 'Statistiques'], ['slid', 'Paramètres'],
  ];
  const kpis = [
    ['REND.-VOUS', '24', '+2 vs hier', 'ok'], ['EN CONSULT.', '2', 'Dr Martin · Dr Petit', 'pri'],
    ['CA DU JOUR', '2 840 €', 'reçu ce matin', 'ok'], ['NO-SHOW', '1', 'sur 24 patients', 'warn'],
  ];
  const agenda = [
    ['09:00', 'Amélie Rousseau', 'Consultation + OCT · cab. 1', 'pri'],
    ['09:30', 'Jean-Marc Petit', 'Tonométrie · cab. 2', 'pri'],
    ['10:00', 'Sofia Benali', 'Suivi cataracte · cab. 1', 'warn'],
    ['10:30', 'Karim Haddad', 'Contrôle post-op · cab. 2', 'ok'],
    ['11:15', 'Claire Dubois', 'Bilan complet · cab. 1', 'pri'],
  ];
  const queue = [
    ['09:12', 'AR', 'Amélie Rousseau', 'OCT', 'En cours', 'pri', true],
    ['09:30', 'JP', 'Jean-Marc Petit', 'Tonométrie', 'En attente', 'warn'],
    ['09:45', 'SB', 'Sofia Benali', 'Suivi cataracte', 'En attente', 'warn'],
    ['10:15', 'CD', 'Claire Dubois', 'Bilan complet', 'En attente', 'warn'],
  ];
  const soft = { pri: [p.priS, p.pri], warn: [p.warnS, p.warn], ok: [p.okS, p.ok] };

  let s = `<defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p.ga}"/><stop offset="1" stop-color="${p.gb}"/></linearGradient>
  <linearGradient id="ov${k}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${p.ga}" stop-opacity="0.92"/><stop offset="0.55" stop-color="${p.ga}" stop-opacity="0.55"/><stop offset="1" stop-color="${p.ga}" stop-opacity="0.12"/></linearGradient></defs>`;
  /* fenêtre */
  s += `<rect x="0" y="0" width="880" height="720" rx="16" fill="#10131B" stroke="rgba(255,255,255,0.14)"/>`;
  s += `<path d="M0 44h880v660a16 16 0 01-16 16H16a16 16 0 01-16-16Z" fill="${p.bg}"/>`;
  for (let i = 0; i < 3; i++) s += `<circle cx="${30 + i * 20}" cy="22" r="5.5" fill="#3A4152"/>`;
  s += `<rect x="92" y="11" width="330" height="22" rx="11" fill="#0D1017"/><text x="257" y="26" font-family="JetBrains Mono" font-size="10.5" fill="#6E7690" text-anchor="middle" letter-spacing="0.4">app.oculis-clinique.fr/pilotage</text>`;
  /* sidebar */
  s += `<path d="M0 44h200v676H16a16 16 0 01-16-16Z" fill="${p.side}"/>`;
  s += `<rect x="18" y="62" width="30" height="30" rx="9" fill="url(#${g})"/>${I('eye', 24, 68, 18, '#FFFFFF', 2)}`;
  s += `<text x="56" y="78" font-family="Manrope" font-weight="800" font-size="14.5" fill="#FFFFFF">Oculis</text>`;
  s += `<text x="56" y="91" font-family="Manrope" font-weight="700" font-size="6.8" fill="${p.sideTx}" letter-spacing="1.4">CLINIQUE OPHTALMO</text>`;
  nav.forEach((n, i) => {
    const y = 110 + i * 36, on = n[2];
    if (on) s += `<rect x="12" y="${y}" width="176" height="30" rx="8" fill="${p.pri}"/>`;
    s += I(n[0], 21, y + 8, 13.5, on ? '#FFFFFF' : p.sideTx, 1.9);
    s += `<text x="42" y="${y + 19.5}" font-family="Manrope" font-weight="${on ? 800 : 600}" font-size="10.5" fill="${on ? '#FFFFFF' : p.sideTx}">${esc(n[1])}</text>`;
    if (on) s += `<circle cx="176" cy="${y + 15}" r="2.6" fill="${p.acc}"/>`;
  });
  s += `<path d="M12 648h176" stroke="rgba(255,255,255,0.10)"/><circle cx="30" cy="680" r="13" fill="url(#${g})"/>`;
  s += `<text x="30" y="684" font-family="Manrope" font-weight="800" font-size="9" fill="#FFF" text-anchor="middle">CL</text>`;
  s += `<text x="50" y="676" font-family="Manrope" font-weight="800" font-size="10" fill="#FFF">Claire Laurent</text>`;
  s += `<text x="50" y="690" font-family="Manrope" font-weight="600" font-size="8" fill="${p.sideTx}">Accueil &amp; gestion</text>`;
  /* topbar */
  s += `<text x="224" y="86" font-family="Manrope" font-weight="800" font-size="21" fill="${p.t1}">Pilotage</text>`;
  s += `<text x="224" y="104" font-family="Manrope" font-weight="600" font-size="10.5" fill="${p.t3}">Réception · Mardi 17 septembre 2026</text>`;
  s += `<rect x="560" y="70" width="180" height="30" rx="15" fill="${p.surface}" stroke="${p.border}"/>${I('search', 571, 78, 14, p.t3)}`;
  s += `<text x="592" y="89.5" font-family="Manrope" font-weight="600" font-size="10" fill="${p.t3}">Rechercher un patient…</text>`;
  s += `<circle cx="762" cy="85" r="15" fill="${p.surface}" stroke="${p.border}"/>${I('bell', 754, 77, 16, p.t2)}<circle cx="770" cy="76" r="3.6" fill="${p.acc}" stroke="${p.surface}" stroke-width="1.4"/>`;
  s += `<circle cx="814" cy="85" r="15" fill="url(#${g})"/><text x="814" y="89" font-family="Manrope" font-weight="800" font-size="9.5" fill="#FFF" text-anchor="middle">CL</text>`;
  /* bannière photo */
  s += `<rect x="224" y="120" width="616" height="104" rx="14" fill="${p.side}"/>`;
  s += `<image href="${p.photo}" x="224" y="120" width="616" height="104" preserveAspectRatio="xMidYMid slice"/>`;
  s += `<rect x="224" y="120" width="616" height="104" rx="14" fill="rgba(5,7,12,0.22)"/>`;
  s += `<rect x="224" y="120" width="616" height="104" rx="14" fill="url(#ov${k})"/>`;
  s += `<text x="242" y="158" font-family="Manrope" font-weight="800" font-size="14" fill="#FFFFFF">Clinique Oculis</text>`;
  s += `<text x="242" y="177" font-family="Manrope" font-weight="600" font-size="10.5" fill="#FFFFFF" opacity="0.92">Réception &amp; pilotage — 24 RDV · CA 2 840 €</text>`;
  s += `<text x="242" y="207" font-family="Manrope" font-weight="600" font-size="9.5" fill="#FFFFFF" opacity="0.8">Salle d’attente : 6 patients · 2 consultations en cours</text>`;
  s += `<rect x="688" y="138" width="136" height="26" rx="13" fill="#FFFFFF" opacity="0.94"/><text x="756" y="155" font-family="Manrope" font-weight="800" font-size="9.5" fill="${p.t1}" text-anchor="middle">Prendre l’attente</text>`;
  /* KPI */
  kpis.forEach((st, i) => {
    const x = 224 + i * 155;
    s += `<rect x="${x}" y="238" width="145" height="76" rx="12" fill="${p.surface}" stroke="${p.border}"/>`;
    s += `<text x="${x + 13}" y="261" font-family="Manrope" font-weight="800" font-size="8" fill="${p.t3}" letter-spacing="1">${esc(st[0])}</text>`;
    s += `<text x="${x + 13}" y="290" font-family="Manrope" font-weight="800" font-size="22" fill="${p.t1}">${st[1]}</text>`;
    const dotc = { ok: p.ok, warn: p.warn, pri: p.pri, err: p.err }[st[3]];
    s += `<circle cx="${x + 17}" cy="302" r="3.2" fill="${dotc}"/>`;
    s += `<text x="${x + 26}" y="306" font-family="Manrope" font-weight="700" font-size="9" fill="${p.t3}">${esc(st[2])}</text>`;
  });
  /* col A — agenda */
  s += `<rect x="224" y="330" width="200" height="366" rx="12" fill="${p.surface}" stroke="${p.border}"/>`;
  s += `<text x="238" y="356" font-family="Manrope" font-weight="800" font-size="11.5" fill="${p.t1}">Agenda du jour</text>`;
  s += `<rect x="332" y="343" width="22" height="17" rx="8.5" fill="${p.priS}"/><text x="343" y="355.5" font-family="Manrope" font-weight="800" font-size="9" fill="${p.pri}" text-anchor="middle">24</text>`;
  s += `<path d="M243 374v296" stroke="${p.border}"/>`;
  agenda.forEach((a, i) => {
    const y = 372 + i * 62, dotc = { pri: p.pri, warn: p.warn, ok: p.ok }[a[3]];
    s += `<circle cx="243" cy="${y + 12}" r="4.5" fill="${dotc}" stroke="${p.surface}" stroke-width="2"/>`;
    s += `<text x="258" y="${y + 14}" font-family="Manrope" font-weight="800" font-size="10" fill="${p.t1}">${a[0]}</text>`;
    s += `<text x="258" y="${y + 30}" font-family="Manrope" font-weight="800" font-size="11" fill="${p.t1}">${esc(a[1])}</text>`;
    s += `<text x="258" y="${y + 44}" font-family="Manrope" font-weight="600" font-size="8.5" fill="${p.t3}">${esc(a[2])}</text>`;
    if (a[3] === 'warn') s += `<text x="410" y="${y + 14}" font-family="Manrope" font-weight="800" font-size="8" fill="${p.warn}" text-anchor="end">retard 10 min</text>`;
  });
  /* col B — file d'attente */
  s += `<rect x="436" y="330" width="200" height="366" rx="12" fill="${p.surface}" stroke="${p.border}"/>`;
  s += `<text x="450" y="356" font-family="Manrope" font-weight="800" font-size="11.5" fill="${p.t1}">File d’attente</text>`;
  s += `<rect x="542" y="343" width="22" height="17" rx="8.5" fill="${p.warnS}"/><text x="553" y="355.5" font-family="Manrope" font-weight="800" font-size="9" fill="${p.warn}" text-anchor="middle">4</text>`;
  queue.forEach((r, i) => {
    const y = 372 + i * 62, cs = soft[r[5]];
    if (r[6]) s += `<rect x="444" y="${y - 6}" width="184" height="56" rx="10" fill="${p.priS}"/>`;
    s += `<rect x="452" y="${y + 8}" width="36" height="18" rx="7" fill="${p.priS}"/><text x="470" y="${y + 21}" font-family="Manrope" font-weight="800" font-size="9" fill="${p.pri}" text-anchor="middle">${r[0]}</text>`;
    s += `<text x="496" y="${y + 20}" font-family="Manrope" font-weight="800" font-size="10.5" fill="${p.t1}">${esc(r[2])}</text>`;
    s += `<text x="496" y="${y + 34}" font-family="Manrope" font-weight="600" font-size="8.5" fill="${p.t3}">${esc(r[3])}</text>`;
    const cw = chipW(r[4], 7.5);
    s += `<rect x="${612 - cw}" y="${y + 30}" width="${cw}" height="16" rx="8" fill="${cs[0]}"/><text x="${612 - cw / 2}" y="${y + 41.5}" font-family="Manrope" font-weight="800" font-size="7.5" fill="${cs[1]}" text-anchor="middle">${esc(r[4])}</text>`;
  });
  s += `<rect x="436" y="628" width="200" height="0" fill="none"/>`;
  s += `<rect x="444" y="632" width="184" height="30" rx="9" fill="${p.pri}"/>${I('door', 470, 640, 13, '#FFF', 2.2)}`;
  s += `<text x="490" y="651" font-family="Manrope" font-weight="800" font-size="10" fill="#FFF">Prendre l’attente</text>`;
  /* col C — dossier + facturation */
  s += `<rect x="648" y="330" width="192" height="366" rx="12" fill="${p.surface}" stroke="${p.border}"/>`;
  s += `<text x="662" y="356" font-family="Manrope" font-weight="800" font-size="11.5" fill="${p.t1}">Dossier actif</text>`;
  const dw = chipW('N° 0841', 8.5);
  s += `<rect x="${826 - dw}" y="343" width="${dw}" height="17" rx="8.5" fill="${p.accS}"/><text x="${826 - dw / 2}" y="355.5" font-family="Manrope" font-weight="800" font-size="8.5" fill="${p.acc}" text-anchor="middle">N° 0841</text>`;
  s += `<rect x="662" y="370" width="32" height="32" rx="10" fill="url(#${g})"/><text x="678" y="390" font-family="Manrope" font-weight="800" font-size="11" fill="#FFF" text-anchor="middle">AR</text>`;
  s += `<text x="702" y="384" font-family="Manrope" font-weight="800" font-size="11" fill="${p.t1}">Amélie Rousseau</text>`;
  s += `<text x="702" y="398" font-family="Manrope" font-weight="600" font-size="8.5" fill="${p.t3}">34 ans · Assurée CPM T</text>`;
  const vit = [['ACUITÉ OD', '10/10'], ['ACUITÉ OG', '9/10'], ['TA OCULE', '14/15'], ['OCT', '02/03']];
  vit.forEach((v, i) => {
    const x = 662 + (i % 2) * 88, y = 412 + Math.floor(i / 2) * 46;
    s += `<rect x="${x}" y="${y}" width="82" height="40" rx="8" fill="${p.bg}" stroke="${p.border}"/>`;
    s += `<text x="${x + 9}" y="${y + 15}" font-family="Manrope" font-weight="800" font-size="6.3" fill="${p.t3}" letter-spacing="0.5">${v[0]}</text>`;
    s += `<text x="${x + 9}" y="${y + 32}" font-family="Manrope" font-weight="800" font-size="11.5" fill="${p.t1}">${v[1]}</text>`;
  });
  s += `<rect x="662" y="508" width="164" height="58" rx="9" fill="${p.bg}" stroke="${p.border}"/>`;
  s += `<text x="672" y="526" font-family="Manrope" font-weight="800" font-size="6.5" fill="${p.t3}" letter-spacing="0.8">FACTURE DU JOUR</text>`;
  s += `<text x="672" y="545" font-family="Manrope" font-weight="800" font-size="12" fill="${p.t1}">185,00 € <tspan font-size="8.5" font-weight="700" fill="${p.t3}">· CPAM T</tspan></text>`;
  s += `<text x="672" y="559" font-family="Manrope" font-weight="600" font-size="8" fill="${p.t3}">Reste à charge patient : 40,00 €</text>`;
  s += `<rect x="662" y="576" width="164" height="28" rx="8" fill="${p.pri}"/>${I('card', 674, 583, 12, '#FFF', 2)}`;
  s += `<text x="692" y="594" font-family="Manrope" font-weight="800" font-size="9.5" fill="#FFF">Encaisser 185 €</text>`;
  s += `<rect x="662" y="612" width="164" height="28" rx="8" fill="${p.surface}" stroke="${p.border}"/>${I('check', 674, 619, 12, p.t2, 2.2)}`;
  s += `<text x="692" y="630" font-family="Manrope" font-weight="800" font-size="9.5" fill="${p.t2}">Vérifier le dossier</text>`;
  s += `<text x="662" y="668" font-family="Manrope" font-weight="600" font-size="8" fill="${p.t3}">Prochain : 11:15 — M. Dubois · Bilan</text>`;
  return s;
}

/* =====================================================================
   MOCKUP MOBILE (origine 0,0 — 380×860) — app réception
===================================================================== */
function phoneMock(p, k) {
  const g = `gm${k}`;
  const wait = [
    ['09:30', 'Jean-Marc Petit', 'Tonométrie + fond d’œil'],
    ['09:45', 'Sofia Benali', 'Suivi cataracte'],
    ['10:15', 'Claire Dubois', 'Bilan complet'],
  ];
  const today = [
    ['10:30', 'Dr Petit', 'Consultation · cab. 2', 'Planifié', 'pri'],
    ['11:15', 'K. Haddad', 'Contrôle post-op', 'Terminé', 'ok'],
  ];
  const acts = [['door', 'Check-in'], ['plus', 'Nouveau'], ['msg', 'Rappel'], ['card', 'Facture']];
  const soft = { pri: [p.priS, p.pri], ok: [p.okS, p.ok] };
  let s = `<defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p.ga}"/><stop offset="1" stop-color="${p.gb}"/></linearGradient></defs>`;
  s += `<rect x="0" y="0" width="380" height="860" rx="52" fill="#151823" stroke="rgba(255,255,255,0.16)" stroke-width="1.5"/>`;
  s += `<path d="M12 52a40 40 0 0140-40h276a40 40 0 0140 40v756a40 40 0 01-40 40H52a40 40 0 01-40-40Z" fill="${p.bg}"/>`;
  s += `<rect x="142" y="16" width="96" height="20" rx="10" fill="#05060A"/>`;
  s += `<text x="34" y="42" font-family="Manrope" font-weight="800" font-size="11.5" fill="${p.t1}">09:41</text>`;
  s += `<rect x="322" y="33" width="20" height="10" rx="3" fill="none" stroke="${p.t1}" opacity="0.7"/><rect x="324" y="35" width="13" height="6" rx="1.5" fill="${p.t1}" opacity="0.7"/>`;
  s += `<rect x="28" y="58" width="26" height="26" rx="8" fill="url(#${g})"/>${I('eye', 33, 63, 16, '#FFF', 2.2)}`;
  s += `<text x="62" y="77" font-family="Manrope" font-weight="800" font-size="14.5" fill="${p.t1}">Oculis</text>`;
  s += `<circle cx="338" cy="71" r="14" fill="url(#${g})"/><text x="338" y="75.5" font-family="Manrope" font-weight="800" font-size="9.5" fill="#FFF" text-anchor="middle">CL</text>`;
  s += `<rect x="28" y="100" width="324" height="150" rx="20" fill="url(#${g})"/>`;
  s += `<circle cx="330" cy="118" r="58" fill="#FFFFFF" opacity="0.14"/>`;
  s += `<text x="46" y="136" font-family="Manrope" font-weight="800" font-size="17.5" fill="#FFFFFF">Bonjour Claire</text>`;
  s += `<text x="46" y="156" font-family="Manrope" font-weight="600" font-size="11" fill="#FFFFFF" opacity="0.88">24 rendez-vous aujourd’hui · 6 en attente</text>`;
  s += `<rect x="46" y="184" width="188" height="34" rx="17" fill="#FFFFFF" opacity="0.94"/>`;
  s += `<text x="62" y="205" font-family="Manrope" font-weight="800" font-size="11.5" fill="${p.t1}">Prendre l’attente</text>${I('chev', 206, 193, 15, p.t1, 2.4)}`;
  acts.forEach((a, i) => {
    const x = 28 + i * 82;
    s += `<rect x="${x}" y="270" width="74" height="76" rx="14" fill="${p.surface}" stroke="${p.border}"/>`;
    s += `<rect x="${x + 21}" y="280" width="32" height="32" rx="10" fill="${p.priS}"/>${I(a[0], x + 29, 288, 16, p.pri, 2)}`;
    s += `<text x="${x + 37}" y="330" font-family="Manrope" font-weight="800" font-size="8.5" fill="${p.t2}" text-anchor="middle">${a[1]}</text>`;
  });
  s += `<text x="28" y="384" font-family="Manrope" font-weight="800" font-size="13" fill="${p.t1}">Salle d’attente</text>`;
  s += `<rect x="128" y="371" width="22" height="18" rx="9" fill="${p.priS}"/><text x="139" y="384.5" font-family="Manrope" font-weight="800" font-size="10" fill="${p.pri}" text-anchor="middle">3</text>`;
  wait.forEach((r, i) => {
    const y = 398 + i * 70;
    s += `<rect x="28" y="${y}" width="324" height="62" rx="14" fill="${p.surface}" stroke="${p.border}"/>`;
    s += `<rect x="40" y="${y + 17}" width="40" height="28" rx="9" fill="${p.priS}"/><text x="60" y="${y + 35}" font-family="Manrope" font-weight="800" font-size="10.5" fill="${p.pri}" text-anchor="middle">${r[0]}</text>`;
    s += `<text x="94" y="${y + 28}" font-family="Manrope" font-weight="800" font-size="12.5" fill="${p.t1}">${esc(r[1])}</text>`;
    s += `<text x="94" y="${y + 45}" font-family="Manrope" font-weight="600" font-size="10" fill="${p.t3}">${esc(r[2])}</text>`;
    s += I('chev', 322, y + 23, 15, p.t3, 2.2);
  });
  s += `<text x="28" y="632" font-family="Manrope" font-weight="800" font-size="13" fill="${p.t1}">Aujourd’hui</text>`;
  s += `<text x="352" y="632" font-family="Manrope" font-weight="700" font-size="10" fill="${p.t3}" text-anchor="end">2 à venir</text>`;
  today.forEach((r, i) => {
    const y = 646 + i * 70, cs = soft[r[4]];
    s += `<rect x="28" y="${y}" width="324" height="62" rx="14" fill="${p.surface}" stroke="${p.border}"/>`;
    s += `<rect x="40" y="${y + 17}" width="40" height="28" rx="9" fill="${p.priS}"/><text x="60" y="${y + 35}" font-family="Manrope" font-weight="800" font-size="10.5" fill="${p.pri}" text-anchor="middle">${r[0]}</text>`;
    s += `<text x="94" y="${y + 28}" font-family="Manrope" font-weight="800" font-size="12.5" fill="${p.t1}">${esc(r[1])}</text>`;
    s += `<text x="94" y="${y + 45}" font-family="Manrope" font-weight="600" font-size="10" fill="${p.t3}">${esc(r[2])}</text>`;
    const cw = chipW(r[3], 9.5);
    s += `<rect x="${338 - cw}" y="${y + 19}" width="${cw}" height="24" rx="12" fill="${cs[0]}"/><text x="${338 - cw / 2}" y="${y + 35}" font-family="Manrope" font-weight="800" font-size="9.5" fill="${cs[1]}" text-anchor="middle">${esc(r[3])}</text>`;
  });
  const navFill = p.num === '3' ? p.side : p.surface;
  s += `<path d="M12 796h356v12a40 40 0 01-40 40H52a40 40 0 01-40-40Z" fill="${navFill}"/>`;
  s += `<path d="M12 796h356" stroke="${p.num === '3' ? 'rgba(255,255,255,0.09)' : p.border}"/>`;
  const navI = [['door', 'Accueil', true], ['cal', 'RDV'], ['users', 'Patients'], ['chart', 'Stats'], ['user', 'Profil']];
  navI.forEach((n, i) => {
    const x = 34 + i * 72, on = n[2];
    s += I(n[0], x + 13, 806, 18, on ? p.pri : p.t3, 1.9);
    s += `<text x="${x + 22}" y="836" font-family="Manrope" font-weight="800" font-size="8" fill="${on ? p.pri : p.t3}" text-anchor="middle">${n[1]}</text>`;
    if (on) s += `<circle cx="${x + 22}" cy="842" r="2.2" fill="${p.pri}"/>`;
  });
  return s;
}


module.exports = { P, esc, chipW, ICONS, I, deskMock, phoneMock };
