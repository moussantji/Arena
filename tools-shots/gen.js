/* Génère 7 PNG ultra-premium : 3 palettes × (PC Electron + Mobile React Native) + comparatif */
const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const FM = p => path.join(__dirname, 'node_modules/@fontsource', p);

/* ---------- polices (copiées dans un dir scanné par resvg) ---------- */
/* police source : TTF convertis (WOFF1 -> TTF via convert-fonts.js) */
const FONTS = path.join(__dirname, 'fonts-ttf');
if (!fs.readdirSync(FONTS).length) throw new Error('fonts-ttf vide — lancer node convert-fonts.js');
const resvgFontOpts = { fontDirs: [FONTS], loadSystemFonts: false, defaultFontFamily: 'Manrope' };

/* ---------- données palettes ---------- */
const P = {
  1: {
    num: '01', nameA: 'Saphir', nameB: '& Ambre', mood: ['Précision', 'Confiance', 'Luxe sobre'],
    use: 'Interface de gestion · Écran de réception · Palette de référence',
    bg: '#F3F6FB', surface: '#FFFFFF', s2: '#E9EFF8', border: '#D7E0EE',
    t1: '#0C1A30', t2: '#43536E', t3: '#8492AB',
    pri: '#1E56D6', priH: '#1744AC', priS: '#E2EAFC',
    acc: '#C08A2D', accS: '#F6ECDA',
    ok: '#1F8A58', okS: '#DFF3E8', warn: '#A86400', warnS: '#FAEDD7', err: '#C13B3B', errS: '#FAE4E4',
    side: '#0C1A30', sideTx: '#B9C7E0',
    ga: '#1E56D6', gb: '#4F86FF', accentName: 'Accent or',
  },
  2: {
    num: '02', nameA: 'Émeraude', nameB: '& Sable', mood: ['Apaisement', 'Nature', 'Prestige'],
    use: 'Espace patient & bilans · Suivi cataracte / post-op',
    bg: '#F5F3EC', surface: '#FFFFFF', s2: '#EFECE1', border: '#E0DBCB',
    t1: '#13251E', t2: '#48584F', t3: '#8A948C',
    pri: '#0F6B52', priH: '#0B5540', priS: '#DFF0E8',
    acc: '#B0702A', accS: '#F5E9D6',
    ok: '#2F7D4E', okS: '#E3F1E7', warn: '#A26605', warnS: '#F6EDD8', err: '#B23F2C', errS: '#F7E5E0',
    side: '#10221B', sideTx: '#B4C9BC',
    ga: '#0F6B52', gb: '#37A37F', accentName: 'Accent cuivre',
  },
  3: {
    num: '03', nameA: 'Onyx', nameB: '& Iris', mood: ['Technologie', 'Nuit', 'Signature'],
    use: 'Mode sombre · Salle d’imagerie OCT · App patient premium',
    bg: '#0B0D13', surface: '#141824', s2: '#1C2130', border: '#272E42',
    t1: '#F1F3FA', t2: '#A7AEC6', t3: '#6E7592',
    pri: '#7B5CF6', priH: '#9377FF', priS: '#292349',
    acc: '#FF9E6D', accS: '#3B2B21',
    ok: '#34D399', okS: '#123227', warn: '#F5B62E', warnS: '#352B10', err: '#F0716B', errS: '#3A1E1E',
    side: '#0E1119', sideTx: '#9AA1BC',
    ga: '#7B5CF6', gb: '#B18CFF', accentName: 'Accent abricot',
  },
};

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const hex2rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));

/* ---------- icônes 24×24 (stroke) ---------- */
const ICONS = {
  eye: c => `<path d="M2.2 12S5.8 5.8 12 5.8 21.8 12 21.8 12 18.2 18.2 12 18.2 2.2 12 2.2 12Z"/><circle cx="12" cy="12" r="3.1"/>`,
  grid: () => `<rect x="3.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.8"/>`,
  door: c => `<rect x="5" y="3.5" width="14" height="17" rx="2.2"/><circle cx="15" cy="12" r="1.15" fill="${c}" stroke="none"/>`,
  cal: () => `<rect x="3.5" y="5" width="17" height="15.5" rx="2.4"/><path d="M3.5 10h17M8.5 3v4M15.5 3v4"/>`,
  users: () => `<circle cx="9.5" cy="8.5" r="3.4"/><path d="M3 19.5c.8-3.6 3.4-5.4 6.5-5.4s5.7 1.8 6.5 5.4M15.8 5.6a3.4 3.4 0 010 5.9M18.5 14.6c1.6.8 2.7 2.3 3.2 4.4"/>`,
  pulse: () => `<path d="M3 12h4l2.4-6 4.2 12 2.4-6H21"/>`,
  scan: () => `<path d="M4 8V5.8A1.8 1.8 0 015.8 4H8M16 4h2.2A1.8 1.8 0 0120 5.8V8M20 16v2.2a1.8 1.8 0 01-1.8 1.8H16M8 20H5.8A1.8 1.8 0 014 18.2V16"/><circle cx="12" cy="12" r="3.4"/>`,
  card: () => `<rect x="3" y="5.5" width="18" height="13.5" rx="2.4"/><path d="M3 10.5h18M6.8 15h4.5"/>`,
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
  mobile: () => `<rect x="7" y="3" width="10" height="18" rx="2.6"/><path d="M11 17.8h2"/>`,
  clock: () => `<circle cx="12" cy="12" r="8.4"/><path d="M12 7.2v4.8l3.4 2"/>`,
  electron: c => `<ellipse cx="12" cy="12" rx="9.5" ry="4" transform="rotate(0 12 12)"/><ellipse cx="12" cy="12" rx="9.5" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9.5" ry="4" transform="rotate(-60 12 12)"/><circle cx="12" cy="12" r="1.8" fill="${c}" stroke="none"/>`,
  rn: c => `<circle cx="12" cy="12" r="1.9" fill="${c}" stroke="none"/><ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(0 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(-60 12 12)"/>`,
};
const I = (name, x, y, s, c, sw = 1.8) =>
  `<g transform="translate(${x} ${y}) scale(${(s / 24).toFixed(4)})" fill="none" stroke="${c}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${ICONS[name](c)}</g>`;

const chipW = (txt, fs) => Math.round(txt.length * fs * 0.66 + 26);

/* =====================================================================
   MOCKUP DESKTOP (origine 0,0 — 880×720)
===================================================================== */
function deskMock(p, k) {
  const g = `g${k}`;
  const nav = [
    ['grid', 'Tableau de bord'], ['door', 'Réception', true], ['cal', 'Rendez-vous'], ['users', 'Patients'],
    ['pulse', 'Consultations'], ['scan', 'Imagerie OCT'], ['card', 'Facturation'], ['slid', 'Paramètres'],
  ];
  const rows = [
    ['09:12', 'AR', 'Amélie Rousseau', 'Consultation + OCT · Dr Martin', 'En cours', 'pri', true],
    ['09:30', 'JP', 'Jean-Marc Petit', 'Tonométrie + fond d’œil · Dr Petit', 'En attente', 'warn'],
    ['09:45', 'SB', 'Sofia Benali', 'Suivi cataracte · Dr Martin', 'En attente', 'warn'],
    ['10:00', 'KH', 'Karim Haddad', 'Contrôle post-op · Dr Petit', 'Terminé', 'ok'],
    ['10:15', 'CD', 'Claire Dubois', 'Bilan complet · Dr Moreau', 'En attente', 'warn'],
  ];
  const stats = [
    ['REND.-VOUS', '24', '+2 vs hier', 'ok'], ['EN ATTENTE', '6', 'salle d’attente', 'warn'],
    ['EN CONSULT.', '2', 'Dr Martin · Dr Petit', 'pri'], ['RETARDS', '3', '> 10 min', 'err'],
  ];
  let s = `<defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p.ga}"/><stop offset="1" stop-color="${p.gb}"/></linearGradient></defs>`;
  /* fenêtre navigateur */
  s += `<rect x="0" y="0" width="880" height="720" rx="16" fill="#10131B" stroke="rgba(255,255,255,0.14)"/>`;
  s += `<path d="M0 44h880v660a16 16 0 01-16 16H16a16 16 0 01-16-16Z" fill="${p.bg}"/>`;
  for (let i = 0; i < 3; i++) s += `<circle cx="${30 + i * 20}" cy="22" r="5.5" fill="#3A4152"/>`;
  s += `<rect x="92" y="11" width="330" height="22" rx="11" fill="#0D1017"/><text x="257" y="26" font-family="JetBrains Mono" font-size="10.5" fill="#6E7690" text-anchor="middle" letter-spacing="0.4">app.oculis-clinique.fr/reception</text>`;
  /* sidebar */
  s += `<path d="M0 44h210v676H16a16 16 0 01-16-16Z" fill="${p.side}"/>`;
  s += `<rect x="18" y="66" width="34" height="34" rx="10" fill="url(#${g})"/>${I('eye', 25, 73, 20, '#FFFFFF', 2)}`;
  s += `<text x="62" y="82" font-family="Manrope" font-weight="800" font-size="16" fill="#FFFFFF">Oculis</text>`;
  s += `<text x="62" y="96" font-family="Manrope" font-weight="700" font-size="7.5" fill="${p.sideTx}" letter-spacing="1.6">CLINIQUE OPHTALMO</text>`;
  nav.forEach((n, i) => {
    const y = 122 + i * 44, on = n[2];
    if (on) s += `<rect x="12" y="${y}" width="186" height="34" rx="9" fill="${p.pri}"/>`;
    s += I(n[0], 22, y + 10, 15, on ? '#FFFFFF' : p.sideTx, 1.9);
    s += `<text x="46" y="${y + 22}" font-family="Manrope" font-weight="${on ? 800 : 600}" font-size="12.5" fill="${on ? '#FFFFFF' : p.sideTx}">${esc(n[1])}</text>`;
    if (on) s += `<circle cx="184" cy="${y + 17}" r="3" fill="${p.acc}"/>`;
  });
  s += `<path d="M12 640h186" stroke="rgba(255,255,255,0.10)"/><circle cx="32" cy="676" r="15" fill="url(#${g})"/>`;
  s += `<text x="32" y="680.5" font-family="Manrope" font-weight="800" font-size="10.5" fill="#FFF" text-anchor="middle">CL</text>`;
  s += `<text x="56" y="672" font-family="Manrope" font-weight="800" font-size="11.5" fill="#FFF">Claire Laurent</text>`;
  s += `<text x="56" y="686" font-family="Manrope" font-weight="600" font-size="9" fill="${p.sideTx}">Accueil &amp; facturation</text>`;
  /* en-tête main */
  s += `<text x="234" y="96" font-family="Manrope" font-weight="800" font-size="23" fill="${p.t1}">Réception</text>`;
  s += `<text x="234" y="114" font-family="Manrope" font-weight="600" font-size="11.5" fill="${p.t3}">Mardi 17 septembre 2026</text>`;
  s += `<rect x="560" y="74" width="188" height="32" rx="16" fill="${p.surface}" stroke="${p.border}"/>${I('search', 572, 82, 15, p.t3)}`;
  s += `<text x="594" y="94" font-family="Manrope" font-weight="600" font-size="10.5" fill="${p.t3}">Rechercher un patient…</text>`;
  s += `<circle cx="772" cy="90" r="16" fill="${p.surface}" stroke="${p.border}"/>${I('bell', 763, 81, 18, p.t2)}<circle cx="780" cy="80" r="4" fill="${p.acc}" stroke="${p.surface}" stroke-width="1.6"/>`;
  s += `<circle cx="822" cy="90" r="16" fill="url(#${g})"/><text x="822" y="94.5" font-family="Manrope" font-weight="800" font-size="10.5" fill="#FFF" text-anchor="middle">CL</text>`;
  /* stats */
  stats.forEach((st, i) => {
    const x = 234 + i * 155;
    s += `<rect x="${x}" y="136" width="143" height="78" rx="12" fill="${p.surface}" stroke="${p.border}"/>`;
    s += `<text x="${x + 14}" y="160" font-family="Manrope" font-weight="800" font-size="8.5" fill="${p.t3}" letter-spacing="1.2">${esc(st[0])}</text>`;
    s += `<text x="${x + 14}" y="190" font-family="Manrope" font-weight="800" font-size="26" fill="${p.t1}">${st[1]}</text>`;
    const dotc = { ok: p.ok, warn: p.warn, pri: p.pri, err: p.err }[st[3]];
    s += `<circle cx="${x + 18}" cy="203" r="3.5" fill="${dotc}"/>`;
    s += `<text x="${x + 28}" y="207" font-family="Manrope" font-weight="700" font-size="9.5" fill="${p.t3}">${esc(st[2])}</text>`;
  });
  /* file d'accueil */
  s += `<rect x="234" y="230" width="430" height="464" rx="12" fill="${p.surface}" stroke="${p.border}"/>`;
  s += `<text x="250" y="258" font-family="Manrope" font-weight="800" font-size="13" fill="${p.t1}">File d’accueil</text>`;
  s += `<rect x="330" y="243" width="24" height="18" rx="9" fill="${p.priS}"/><text x="342" y="256.5" font-family="Manrope" font-weight="800" font-size="10" fill="${p.pri}" text-anchor="middle">5</text>`;
  s += `<rect x="576" y="242" width="76" height="20" rx="10" fill="${p.s2}" stroke="${p.border}"/><text x="614" y="255.5" font-family="Manrope" font-weight="700" font-size="9.5" fill="${p.t2}" text-anchor="middle">Tous patients</text>`;
  rows.forEach((r, i) => {
    const y = 272 + i * 81, soft = { pri: [p.priS, p.pri], warn: [p.warnS, p.warn], ok: [p.okS, p.ok] }[r[5]];
    if (r[6]) s += `<rect x="235" y="${y - 8}" width="428" height="72" rx="10" fill="${p.priS}"/>`;
    s += `<text x="250" y="${y + 22}" font-family="Manrope" font-weight="800" font-size="13" fill="${p.t1}">${r[0]}</text>`;
    s += `<circle cx="300" cy="${y + 17}" r="14" fill="${p.s2}" stroke="${p.border}"/><text x="300" y="${y + 21}" font-family="Manrope" font-weight="800" font-size="9" fill="${p.t2}" text-anchor="middle">${r[1]}</text>`;
    s += `<text x="326" y="${y + 14}" font-family="Manrope" font-weight="800" font-size="12.5" fill="${p.t1}">${esc(r[2])}</text>`;
    s += `<text x="326" y="${y + 31}" font-family="Manrope" font-weight="600" font-size="10" fill="${p.t3}">${esc(r[3])}</text>`;
    const cw = chipW(r[4], 10.5);
    s += `<rect x="${652 - cw}" y="${y + 4}" width="${cw}" height="22" rx="11" fill="${soft[0]}"/><text x="${652 - cw / 2}" y="${y + 19}" font-family="Manrope" font-weight="800" font-size="10.5" fill="${soft[1]}" text-anchor="middle">${esc(r[4])}</text>`;
    s += `<circle cx="646" cy="${y + 15}" r="13" fill="${p.s2}"/>${I(r[5] === 'ok' ? 'check' : 'phone', 639, y + 8, 14, p.t3)}`;
    if (i < 4) s += `<path d="M250 ${y + 48}h400" stroke="${p.border}"/>`;
  });
  /* dossier patient */
  s += `<rect x="678" y="230" width="182" height="464" rx="12" fill="${p.surface}" stroke="${p.border}"/>`;
  s += `<text x="692" y="258" font-family="Manrope" font-weight="800" font-size="13" fill="${p.t1}">Dossier</text>`;
  const dw = chipW('N° 2026-0841', 9.5);
  s += `<rect x="${846 - dw}" y="243" width="${dw}" height="20" rx="10" fill="${p.accS}"/><text x="${846 - dw / 2}" y="256.5" font-family="Manrope" font-weight="800" font-size="9.5" fill="${p.acc}" text-anchor="middle">N° 2026-0841</text>`;
  s += `<rect x="692" y="276" width="44" height="44" rx="13" fill="url(#${g})"/><text x="714" y="303" font-family="Manrope" font-weight="800" font-size="15" fill="#FFF" text-anchor="middle">AR</text>`;
  s += `<text x="746" y="294" font-family="Manrope" font-weight="800" font-size="13.5" fill="${p.t1}">Amélie</text>`;
  s += `<text x="746" y="310" font-family="Manrope" font-weight="600" font-size="10" fill="${p.t3}">Rousseau · 34 ans</text>`;
  const vit = [['ACUITÉ OD', '10/10'], ['ACUITÉ OG', '9/10'], ['TENSION OC.', '14/15'], ['DERNIER OCT', '02/03/26']];
  vit.forEach((v, i) => {
    const x = 692 + (i % 2) * 77, y = 338 + Math.floor(i / 2) * 58;
    s += `<rect x="${x}" y="${y}" width="70" height="50" rx="9" fill="${p.bg}" stroke="${p.border}"/>`;
    s += `<text x="${x + 9}" y="${y + 16}" font-family="Manrope" font-weight="800" font-size="6.8" fill="${p.t3}" letter-spacing="0.6">${v[0]}</text>`;
    s += `<text x="${x + 9}" y="${y + 37}" font-family="Manrope" font-weight="800" font-size="12.5" fill="${p.t1}">${v[1]}</text>`;
  });
  s += `<rect x="692" y="462" width="70" height="34" rx="9" fill="${p.pri}"/>${I('check', 702, 472, 13, '#FFF', 2.4)}`;
  s += `<text x="721" y="483" font-family="Manrope" font-weight="800" font-size="10" fill="#FFF">Check</text>`;
  s += `<rect x="769" y="462" width="77" height="34" rx="9" fill="${p.surface}" stroke="${p.border}"/>${I('card', 779, 472, 13, p.t2)}`;
  s += `<text x="798" y="483" font-family="Manrope" font-weight="800" font-size="10" fill="${p.t2}">Facture</text>`;
  s += `<rect x="692" y="516" width="154" height="92" rx="10" fill="${p.bg}" stroke="${p.border}"/>`;
  s += `<text x="704" y="536" font-family="Manrope" font-weight="800" font-size="7" fill="${p.t3}" letter-spacing="1">DROIT AU SOIN</text>`;
  s += `<text x="704" y="556" font-family="Manrope" font-weight="800" font-size="12" fill="${p.t1}">CPAM · T</text>`;
  s += `<text x="704" y="576" font-family="Manrope" font-weight="600" font-size="8.5" fill="${p.t3}">Dossier assuré vérifié</text>`;
  s += `<path d="M704 588h12" stroke="${p.ok}" stroke-width="2.4" stroke-linecap="round"/>${I('check', 718, 581, 12, p.ok, 2.4)}`;
  return s;
}

/* =====================================================================
   MOCKUP MOBILE (origine 0,0 — 380×860)
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
  let s = `<defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p.ga}"/><stop offset="1" stop-color="${p.gb}"/></linearGradient></defs>`;
  s += `<rect x="0" y="0" width="380" height="860" rx="52" fill="#151823" stroke="rgba(255,255,255,0.16)" stroke-width="1.5"/>`;
  s += `<path d="M12 52a40 40 0 0140-40h276a40 40 0 0140 40v756a40 40 0 01-40 40H52a40 40 0 01-40-40Z" fill="${p.bg}"/>`;
  s += `<rect x="142" y="16" width="96" height="20" rx="10" fill="#05060A"/>`;
  s += `<text x="34" y="42" font-family="Manrope" font-weight="800" font-size="11.5" fill="${p.t1}">09:41</text>`;
  s += `<rect x="322" y="33" width="20" height="10" rx="3" fill="none" stroke="${p.t1}" opacity="0.7"/><rect x="324" y="35" width="13" height="6" rx="1.5" fill="${p.t1}" opacity="0.7"/>`;
  /* top */
  s += `<rect x="28" y="58" width="26" height="26" rx="8" fill="url(#${g})"/>${I('eye', 33, 63, 16, '#FFF', 2.2)}`;
  s += `<text x="62" y="77" font-family="Manrope" font-weight="800" font-size="14.5" fill="${p.t1}">Oculis</text>`;
  s += `<circle cx="338" cy="71" r="14" fill="url(#${g})"/><text x="338" y="75.5" font-family="Manrope" font-weight="800" font-size="9.5" fill="#FFF" text-anchor="middle">CL</text>`;
  /* hero */
  s += `<rect x="28" y="100" width="324" height="150" rx="20" fill="url(#${g})"/>`;
  s += `<circle cx="330" cy="118" r="58" fill="#FFFFFF" opacity="0.14"/>`;
  s += `<text x="46" y="136" font-family="Manrope" font-weight="800" font-size="17.5" fill="#FFFFFF">Bonjour Claire</text>`;
  s += `<text x="46" y="156" font-family="Manrope" font-weight="600" font-size="11" fill="#FFFFFF" opacity="0.88">24 rendez-vous aujourd’hui · 6 en attente</text>`;
  s += `<rect x="46" y="184" width="188" height="34" rx="17" fill="#FFFFFF" opacity="0.94"/>`;
  s += `<text x="62" y="205" font-family="Manrope" font-weight="800" font-size="11.5" fill="${p.t1}">Prendre l’attente</text>${I('chev', 206, 193, 15, p.t1, 2.4)}`;
  /* actions rapides */
  acts.forEach((a, i) => {
    const x = 28 + i * 82;
    s += `<rect x="${x}" y="270" width="74" height="76" rx="14" fill="${p.surface}" stroke="${p.border}"/>`;
    s += `<rect x="${x + 21}" y="280" width="32" height="32" rx="10" fill="${p.priS}"/>${I(a[0], x + 29, 288, 16, p.pri, 2)}`;
    s += `<text x="${x + 37}" y="330" font-family="Manrope" font-weight="800" font-size="8.5" fill="${p.t2}" text-anchor="middle">${a[1]}</text>`;
  });
  /* salle d'attente */
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
  /* aujourd'hui */
  s += `<text x="28" y="632" font-family="Manrope" font-weight="800" font-size="13" fill="${p.t1}">Aujourd’hui</text>`;
  s += `<text x="352" y="632" font-family="Manrope" font-weight="700" font-size="10" fill="${p.t3}" text-anchor="end">2 à venir</text>`;
  today.forEach((r, i) => {
    const y = 646 + i * 70, soft = { pri: [p.priS, p.pri], ok: [p.okS, p.ok] }[r[4]];
    s += `<rect x="28" y="${y}" width="324" height="62" rx="14" fill="${p.surface}" stroke="${p.border}"/>`;
    s += `<rect x="40" y="${y + 17}" width="40" height="28" rx="9" fill="${p.priS}"/><text x="60" y="${y + 35}" font-family="Manrope" font-weight="800" font-size="10.5" fill="${p.pri}" text-anchor="middle">${r[0]}</text>`;
    s += `<text x="94" y="${y + 28}" font-family="Manrope" font-weight="800" font-size="12.5" fill="${p.t1}">${esc(r[1])}</text>`;
    s += `<text x="94" y="${y + 45}" font-family="Manrope" font-weight="600" font-size="10" fill="${p.t3}">${esc(r[2])}</text>`;
    const cw = chipW(r[3], 9.5);
    s += `<rect x="${338 - cw}" y="${y + 19}" width="${cw}" height="24" rx="12" fill="${soft[0]}"/><text x="${338 - cw / 2}" y="${y + 35}" font-family="Manrope" font-weight="800" font-size="9.5" fill="${soft[1]}" text-anchor="middle">${esc(r[3])}</text>`;
  });
  /* bottom nav */
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

/* =====================================================================
   COMPOSANTS FEUILLE
===================================================================== */
function headerBlock(p, k, W, hName, nameY, chipY, badge, sub) {
  let s = `<defs>
    <radialGradient id="gl${k}a" cx="0.15" cy="0" r="0.9"><stop offset="0" stop-color="${p.ga}" stop-opacity="0.16"/><stop offset="1" stop-color="${p.ga}" stop-opacity="0"/></radialGradient>
    <radialGradient id="gl${k}b" cx="1" cy="1.05" r="0.85"><stop offset="0" stop-color="${p.acc}" stop-opacity="0.09"/><stop offset="1" stop-color="${p.acc}" stop-opacity="0"/></radialGradient>
    <pattern id="grid${k}" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48 0H0v48" fill="none" stroke="rgba(255,255,255,0.028)"/></pattern>
    <linearGradient id="gr${k}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${p.ga}"/><stop offset="1" stop-color="${p.gb}"/></linearGradient>
    <filter id="sh${k}" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="26" stdDeviation="38" flood-color="#000000" flood-opacity="0.55"/></filter>
  </defs>`;
  s += `<rect width="${W}" height="1080" fill="#0A0B0F"/>`;
  s += `<rect width="${W}" height="1080" fill="url(#gl${k}a)"/><rect width="${W}" height="1080" fill="url(#gl${k}b)"/><rect width="${W}" height="1080" fill="url(#grid${k})"/>`;
  s += `<text x="80" y="92" font-family="Manrope" font-weight="800" font-size="12" fill="#9AA1B8" letter-spacing="3">OCULIS · SYSTÈME DE PALETTE — OPHTALMOLOGIE</text>`;
  s += `<text x="76" y="${nameY}" font-family="Fraunces" font-weight="600" font-size="${hName}" fill="#F4F5FB">${esc(p.nameA)} <tspan font-style="italic" font-weight="300" fill="#E9EBF4">${esc(p.nameB)}</tspan></text>`;
  let cx = 80;
  p.mood.forEach(m => {
    const w = chipW(m.toUpperCase(), 10.5);
    s += `<rect x="${cx}" y="${chipY}" width="${w}" height="28" rx="14" fill="none" stroke="rgba(255,255,255,0.16)"/>`;
    s += `<text x="${cx + w / 2}" y="${chipY + 18}" font-family="Manrope" font-weight="800" font-size="10.5" fill="#B9C0D8" text-anchor="middle" letter-spacing="1.6">${m.toUpperCase()}</text>`;
    cx += w + 12;
  });
  s += `<text x="80" y="${chipY + 62}" font-family="Manrope" font-weight="600" font-size="13.5" fill="#8F96B0">${esc(sub)}</text>`;
  /* badge plateforme */
  const bx = W - 80 - 292;
  s += `<rect x="${bx}" y="62" width="292" height="66" rx="14" fill="rgba(255,255,255,0.045)" stroke="rgba(255,255,255,0.13)"/>`;
  s += I(badge.icon, bx + 18, 81, 28, p.gb, 1.6);
  s += `<text x="${bx + 62}" y="92" font-family="Manrope" font-weight="800" font-size="15.5" fill="#F4F5FB" letter-spacing="1">${badge.t1}</text>`;
  s += `<text x="${bx + 62}" y="111" font-family="Manrope" font-weight="600" font-size="10.5" fill="#8F96B0">${badge.t2}</text>`;
  return s;
}

function footerBlock(W, p) {
  return `<text x="80" y="1060" font-family="Manrope" font-weight="800" font-size="10.5" fill="#6E7690" letter-spacing="2">OCULIS · PALETTE ${p.num} / 03</text>
  <text x="${W / 2}" y="1060" font-family="Manrope" font-weight="700" font-size="10.5" fill="#6E7690" text-anchor="middle" letter-spacing="1.5">CONTRASTE AA — TEXTE PRINCIPAL 12:1 MIN SUR FOND</text>
  <text x="${W - 80}" y="1060" font-family="JetBrains Mono" font-size="10.5" fill="#6E7690" text-anchor="end">export : index.html · palette ${p.num}</text>`;
}

/* ---------- feuille PC (1920×1080) ---------- */
function sheetPC(k) {
  const p = P[k];
  const tok = [
    ['Fond', p.bg], ['Surface', p.surface], ['Surface 2', p.s2], ['Bordure', p.border],
    ['Texte 1', p.t1], ['Texte 2', p.t2], ['Texte 3', p.t3],
  ];
  const marq = [['Primaire', p.pri], ['Primaire · hover', p.priH], ['Primaire · soft', p.priS], [p.accentName, p.acc], ['Accent · soft', p.accS]];
  const etat = [['Succès', p.ok], ['Succès · soft', p.okS], ['Alerte', p.warn], ['Alerte · soft', p.warnS], ['Erreur', p.err], ['Erreur · soft', p.errS]];
  const row = (x, y, name, val, grad) =>
    `<rect x="${x}" y="${y}" width="44" height="44" rx="10" fill="${grad ? `url(#gr${k})` : val}" stroke="rgba(255,255,255,0.12)"/>
     <text x="${x + 62}" y="${y + 20}" font-family="Manrope" font-weight="700" font-size="13" fill="#E9EBF4">${esc(name)}</text>
     <text x="${x + 62}" y="${y + 37}" font-family="JetBrains Mono" font-size="11.5" fill="#8F96B0">${grad ? '135° ' + p.ga + ' → ' + p.gb : val}</text>`;
  const sec = (x, y, t) => `<text x="${x}" y="${y}" font-family="Manrope" font-weight="800" font-size="11" fill="#9AA1B8" letter-spacing="2.6">${t}</text>`;

  let s = headerBlock(p, k, 1920, 72, 196, 232, { icon: 'electron', t1: 'PC · ELECTRON', t2: 'Fenêtre 1920×1080 · Design system' },
    'Recommandé — ' + p.use);

  /* mockup gauche */
  s += `<g filter="url(#sh${k})"><rect x="80" y="316" width="880" height="720" rx="16" fill="#10131B"/></g>`;
  s += `<g transform="translate(80 316)">${deskMock(p, k)}</g>`;

  /* tokens droite — barre dégradé + specs en haut */
  const X1 = 1010, X2 = 1448;
  s += `<rect x="${X1}" y="190" width="852" height="44" rx="12" fill="url(#gr${k})"/>`;
  s += `<text x="${X1 + 16}" y="218" font-family="JetBrains Mono" font-size="12" fill="#FFFFFF" font-weight="700">linear-gradient(135deg, ${p.ga}, ${p.gb})</text>`;
  const specs = ['RADIUS PC 14 PX', 'SIDEBAR 240 PX', 'BASE 14 PX', 'OMBRE 14 PX / 10%'];
  specs.forEach((sp, i) => {
    const x = X1 + i * 218;
    s += `<rect x="${x}" y="252" width="204" height="34" rx="10" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)"/>`;
    s += `<text x="${x + 102}" y="273.5" font-family="JetBrains Mono" font-size="10.5" fill="#B9C0D8" text-anchor="middle">${sp}</text>`;
  });
  /* nuancier */
  s += sec(X1, 340, 'TOKENS — SURFACES &amp; TEXTES');
  for (let i = 0; i < 4; i++) s += row(X1, 364 + i * 50, tok[i][0], tok[i][1]);
  for (let i = 0; i < 3; i++) s += row(X2, 364 + i * 50, tok[4 + i][0], tok[4 + i][1]);
  s += sec(X1, 584, 'MARQUE');
  for (let i = 0; i < 3; i++) s += row(X1, 608 + i * 50, marq[i][0], marq[i][1]);
  for (let i = 0; i < 2; i++) s += row(X2, 608 + i * 50, marq[3 + i][0], marq[3 + i][1]);
  s += sec(X1, 776, 'ÉTATS');
  for (let i = 0; i < 3; i++) s += row(X1, 800 + i * 50, etat[i][0], etat[i][1]);
  for (let i = 0; i < 3; i++) s += row(X2, 800 + i * 50, etat[3 + i][0], etat[3 + i][1]);
  s += sec(X1, 968, 'STRUCTURE');
  s += row(X1, 992, 'Sidebar PC', p.side);
  s += row(X2, 992, 'Dégradé signature', null, true);
  s += footerBlock(1920, p);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">${s}</svg>`;
}

/* ---------- feuille MOBILE (1080×1920) ---------- */
function sheetMobile(k) {
  const p = P[k];
  const all = [
    ['Fond', p.bg], ['Surface', p.surface], ['Surface 2', p.s2], ['Bordure', p.border],
    ['Texte 1', p.t1], ['Texte 2', p.t2], ['Texte 3', p.t3],
    ['Primaire', p.pri], ['Primaire · hover', p.priH], ['Primaire · soft', p.priS],
    [p.accentName, p.acc], ['Accent · soft', p.accS],
    ['Succès', p.ok], ['Succès · soft', p.okS], ['Alerte', p.warn], ['Alerte · soft', p.warnS],
    ['Erreur', p.err], ['Erreur · soft', p.errS], ['Sidebar', p.side],
  ];
  let s = `<defs>
    <radialGradient id="gma${k}" cx="0.5" cy="0" r="0.95"><stop offset="0" stop-color="${p.ga}" stop-opacity="0.17"/><stop offset="1" stop-color="${p.ga}" stop-opacity="0"/></radialGradient>
    <radialGradient id="gmb${k}" cx="0.5" cy="1.05" r="0.9"><stop offset="0" stop-color="${p.acc}" stop-opacity="0.10"/><stop offset="1" stop-color="${p.acc}" stop-opacity="0"/></radialGradient>
    <pattern id="grd${k}" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48 0H0v48" fill="none" stroke="rgba(255,255,255,0.028)"/></pattern>
    <linearGradient id="grm${k}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${p.ga}"/><stop offset="1" stop-color="${p.gb}"/></linearGradient>
    <filter id="shm${k}" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="26" stdDeviation="38" flood-color="#000000" flood-opacity="0.55"/></filter>
  </defs>`;
  s += `<rect width="1080" height="1920" fill="#0A0B0F"/>`;
  s += `<rect width="1080" height="1920" fill="url(#gma${k})"/><rect width="1080" height="1920" fill="url(#gmb${k})"/><rect width="1080" height="1920" fill="url(#grd${k})"/>`;
  s += `<text x="80" y="92" font-family="Manrope" font-weight="800" font-size="12" fill="#9AA1B8" letter-spacing="3">OCULIS · SYSTÈME DE PALETTE — OPHTALMOLOGIE</text>`;
  s += `<text x="76" y="196" font-family="Fraunces" font-weight="600" font-size="72" fill="#F4F5FB">${esc(p.nameA)} <tspan font-style="italic" font-weight="300">${esc(p.nameB)}</tspan></text>`;
  let cx = 80;
  p.mood.forEach(m => {
    const w = chipW(m.toUpperCase(), 10.5);
    s += `<rect x="${cx}" y="232" width="${w}" height="28" rx="14" fill="none" stroke="rgba(255,255,255,0.16)"/>`;
    s += `<text x="${cx + w / 2}" y="250" font-family="Manrope" font-weight="800" font-size="10.5" fill="#B9C0D8" text-anchor="middle" letter-spacing="1.6">${m.toUpperCase()}</text>`;
    cx += w + 12;
  });
  s += `<text x="80" y="296" font-family="Manrope" font-weight="600" font-size="13.5" fill="#8F96B0">${esc(p.use)}</text>`;
  s += `<rect x="708" y="62" width="292" height="66" rx="14" fill="rgba(255,255,255,0.045)" stroke="rgba(255,255,255,0.13)"/>`;
  s += I('rn', 726, 81, 28, p.gb, 1.6);
  s += `<text x="770" y="92" font-family="Manrope" font-weight="800" font-size="14.5" fill="#F4F5FB" letter-spacing="1">MOBILE · REACT NATIVE</text>`;
  s += `<text x="770" y="111" font-family="Manrope" font-weight="600" font-size="10.5" fill="#8F96B0">App réception · portrait 9:16</text>`;

  /* téléphone */
  s += `<g filter="url(#shm${k})"><rect x="350" y="336" width="380" height="860" rx="52" fill="#151823"/></g>`;
  s += `<g transform="translate(350 336)">${phoneMock(p, k)}</g>`;

  /* tokens : grille 5×3 + 2 lignes dédiées */
  const mrow = (x, y, name, val, grad, icon) => {
    let c = `<rect x="${x}" y="${y}" width="304" height="64" rx="13" fill="rgba(255,255,255,0.035)" stroke="rgba(255,255,255,0.08)"/>`;
    if (icon) c += I(icon, x + 14, y + 19, 26, p.gb, 1.7);
    else c += `<rect x="${x + 14}" y="${y + 12}" width="40" height="40" rx="10" fill="${grad ? `url(#grm${k})` : val}" stroke="rgba(255,255,255,0.12)"/>`;
    c += `<text x="${x + 70}" y="${y + 29}" font-family="Manrope" font-weight="700" font-size="12.5" fill="#E9EBF4">${esc(name)}</text>`;
    c += `<text x="${x + 70}" y="${y + 48}" font-family="JetBrains Mono" font-size="11" fill="#8F96B0">${grad ? p.ga + ' → ' + p.gb : icon ? 'NAV 56PX · TOUCH 44 · R 18' : val}</text>`;
    return c;
  };
  all.slice(0, 15).forEach((t, i) => {
    const col = Math.floor(i / 5), r = i % 5;
    s += mrow(80 + col * 328, 1316 + r * 76, t[0], t[1]);
  });
  const extras = [
    ['Alerte · soft', p.warnS], ['Erreur', p.err], ['Erreur · soft', p.errS],
  ];
  extras.forEach((t, i) => { s += mrow(80 + i * 328, 1316 + 5 * 76, t[0], t[1]); });
  s += mrow(80, 1316 + 6 * 76, 'Sidebar', p.side);
  s += mrow(408, 1316 + 6 * 76, 'Dégradé signature', null, true);
  s += mrow(736, 1316 + 6 * 76, 'Spécifications mobile', null, false, 'mobile');
  s += `<text x="80" y="1905" font-family="Manrope" font-weight="800" font-size="10.5" fill="#6E7690" letter-spacing="2">OCULIS · PALETTE ${p.num} / 03</text>`;
  s += `<text x="1000" y="1905" font-family="JetBrains Mono" font-size="10.5" fill="#6E7690" text-anchor="end">export : index.html · palette ${p.num}</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">${s}</svg>`;
}

/* ---------- comparatif 3 palettes (1920×1080) ---------- */
function sheetOverview() {
  let s = `<defs>
    <radialGradient id="ogla" cx="0.5" cy="0" r="1"><stop offset="0" stop-color="#1E56D6" stop-opacity="0.12"/><stop offset="1" stop-color="#1E56D6" stop-opacity="0"/></radialGradient>
    <radialGradient id="oglb" cx="0.5" cy="1" r="1"><stop offset="0" stop-color="#7B5CF6" stop-opacity="0.10"/><stop offset="1" stop-color="#7B5CF6" stop-opacity="0"/></radialGradient>
    <pattern id="ogrid" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48 0H0v48" fill="none" stroke="rgba(255,255,255,0.028)"/></pattern>
    <filter id="osh" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="26" stdDeviation="38" flood-color="#000000" flood-opacity="0.55"/></filter>
  </defs>`;
  s += `<rect width="1920" height="1080" fill="#0A0B0F"/><rect width="1920" height="1080" fill="url(#ogla)"/><rect width="1920" height="1080" fill="url(#oglb)"/><rect width="1920" height="1080" fill="url(#ogrid)"/>`;
  s += `<text x="80" y="92" font-family="Manrope" font-weight="800" font-size="12" fill="#9AA1B8" letter-spacing="3">OCULIS · OPHTALMOLOGIE — GESTION &amp; RÉCEPTION</text>`;
  s += `<text x="76" y="196" font-family="Fraunces" font-weight="600" font-size="72" fill="#F4F5FB">Trois palettes <tspan font-style="italic" font-weight="300">ultra-premium</tspan></text>`;
  s += `<text x="80" y="248" font-family="Manrope" font-weight="600" font-size="14.5" fill="#8F96B0">Écran Réception · PC (Electron) — aperçu comparatif des 3 systèmes de couleurs</text>`;
  s += `<rect x="1548" y="62" width="292" height="66" rx="14" fill="rgba(255,255,255,0.045)" stroke="rgba(255,255,255,0.13)"/>`;
  s += I('electron', 1566, 81, 28, '#8FB3FF', 1.6);
  s += `<text x="1610" y="92" font-family="Manrope" font-weight="800" font-size="15.5" fill="#F4F5FB" letter-spacing="1">PC · ELECTRON</text>`;
  s += `<text x="1610" y="111" font-family="Manrope" font-weight="600" font-size="10.5" fill="#8F96B0">3 thèmes · 1 design system</text>`;
  [1, 2, 3].forEach((k, i) => {
    const p = P[k], x = 80 + i * 614, sc = 0.585;
    s += `<g filter="url(#osh)"><rect x="${x}" y="300" width="${880 * sc}" height="${720 * sc}" rx="14" fill="#10131B"/></g>`;
    s += `<g transform="translate(${x} 300) scale(${sc})">${deskMock(p, 'ov' + k)}</g>`;
    s += `<rect x="${x}" y="736" width="14" height="40" rx="4" fill="${p.ga}"/>`;
    s += `<text x="${x + 30}" y="754" font-family="Fraunces" font-weight="600" font-size="26" fill="#F4F5FB">${p.num} — ${esc(p.nameA)} <tspan font-style="italic" font-weight="300">${esc(p.nameB)}</tspan></text>`;
    s += `<text x="${x + 30}" y="778" font-family="Manrope" font-weight="600" font-size="12" fill="#8F96B0">${esc(p.use)}</text>`;
    /* mini-swatches */
    [p.bg, p.surface, p.pri, p.acc, p.ok].forEach((c, j) => {
      s += `<circle cx="${x + 500 + j * 34}" cy="760" r="11" fill="${c}" stroke="rgba(255,255,255,0.25)"/>`;
    });
    /* téléphone mini */
    s += `<g transform="translate(${x + 430} 820) scale(0.30)">${phoneMock(p, 'ovm' + k)}</g>`;
  });
  s += `<text x="80" y="1042" font-family="Manrope" font-weight="800" font-size="10.5" fill="#6E7690" letter-spacing="2">OCULIS · SYSTÈME DE PALETTE v1</text>`;
  s += `<text x="1840" y="1042" font-family="JetBrains Mono" font-size="10.5" fill="#6E7690" text-anchor="end">electron + react native</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">${s}</svg>`;
}

/* ---------- rendu ---------- */
const OUT = '/home/user/Arena/palettes-ophtalmo/png';
fs.mkdirSync(OUT, { recursive: true });
const jobs = [
  ['01-saphir-ambre-pc-electron.svg', sheetPC(1)],
  ['01-saphir-ambre-mobile-react-native.svg', sheetMobile(1)],
  ['02-emeraude-sable-pc-electron.svg', sheetPC(2)],
  ['02-emeraude-sable-mobile-react-native.svg', sheetMobile(2)],
  ['03-onyx-iris-pc-electron.svg', sheetPC(3)],
  ['03-onyx-iris-mobile-react-native.svg', sheetMobile(3)],
  ['00-comparatif-3-palettes.svg', sheetOverview()],
];
for (const [name, svg] of jobs) {
  fs.writeFileSync(path.join(OUT, name), svg);
  const r = new Resvg(svg, {
    font: resvgFontOpts,
    fitTo: { mode: 'width', value: name.startsWith('0') && name.includes('mobile') ? 1080 : 1920 },
  });
  const png = r.render().asPng();
  const base = name.replace(/\.svg$/, '.png');
  fs.writeFileSync(path.join(OUT, base), png);
  console.log('OK', base, (png.length / 1024).toFixed(0) + ' Ko');
}
console.log('TERMINÉ');
