/* ============================================================
   DIALLO — Indigo Minuit · générateur Figma
   Crée les styles, les composants et les écrans desktop.
   Aucune donnée externe : tout est défini ci-dessous.
   ============================================================ */

const C = {
  bg: '#070B1F',
  bg2: '#0B1030',
  panel: '#1B2A6B',
  ink: '#F0F2FF',
  dim: '#A7B6FF',
  faint: '#6B78A8',
  line: '#A7B6FF',
  accent: '#5B7CFA',
  accent2: '#7E9BFF',
  copper: '#E0A86F',
  danger: '#F08A8A',
  success: '#6FD3A8',
  white: '#FFFFFF',
};

const rgba = (hex, a) => {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16) / 255,
    g: parseInt(h.slice(2, 4), 16) / 255,
    b: parseInt(h.slice(4, 6), 16) / 255,
    a,
  };
};

const solid = (hex, a = 1) => ({ type: 'SOLID', color: rgba(hex, 1), opacity: a });
const grad = (from, to, a = 1) => ({
  type: 'GRADIENT_LINEAR',
  gradientTransform: [[1, 0, 0], [0, 1, 0]],
  gradientStops: [
    { position: 0, color: rgba(from, a) },
    { position: 1, color: rgba(to, a) },
  ],
});

const W = 1440, H = 900, SIDEBAR = 238, TOPBAR = 54;

/* ---------------- utilitaires ---------------- */
function frame(name, w, h, fill, opts = {}) {
  const f = figma.createFrame();
  f.name = name;
  f.resize(w, h);
  f.fills = fill ? [fill] : [];
  f.clipsContent = opts.clip !== false;
  if (opts.radius) f.cornerRadius = opts.radius;
  if (opts.stroke) {
    f.strokes = [solid(opts.stroke, opts.strokeOpacity ?? 1)];
    f.strokeWeight = 1;
    f.strokeAlign = 'INSIDE';
  }
  return f;
}

function auto(name, dir, gap, pad, fill, opts = {}) {
  const f = figma.createFrame();
  f.name = name;
  f.layoutMode = dir === 'row' ? 'HORIZONTAL' : 'VERTICAL';
  f.itemSpacing = gap;
  f.primaryAxisSizingMode = opts.main ?? 'FIXED';
  f.counterAxisSizingMode = opts.cross ?? 'FIXED';
  f.paddingTop = opts.pt ?? pad;
  f.paddingBottom = opts.pb ?? pad;
  f.paddingLeft = opts.pl ?? pad;
  f.paddingRight = opts.pr ?? pad;
  f.fills = fill ? [fill] : [];
  f.cornerRadius = opts.radius ?? 0;
  f.clipsContent = opts.clip ?? false;
  if (opts.stroke) {
    f.strokes = [solid(opts.stroke, opts.strokeOpacity ?? 1)];
    f.strokeWeight = 1;
    f.strokeAlign = 'INSIDE';
  }
  return f;
}

function rect(parent, x, y, w, h, o = {}) {
  const r = figma.createRectangle();
  r.resize(w, h);
  r.x = x;
  r.y = y;
  r.fills = o.fill ? [o.fill] : [];
  r.cornerRadius = o.radius ?? 0;
  if (o.stroke) {
    r.strokes = [solid(o.stroke, o.strokeOpacity ?? 1)];
    r.strokeWeight = o.strokeWeight ?? 1;
    r.strokeAlign = 'INSIDE';
  }
  if (o.opacity !== undefined) r.opacity = o.opacity;
  parent.appendChild(r);
  return r;
}

function ellipse(parent, x, y, d, o = {}) {
  const e = figma.createEllipse();
  e.resize(d, d);
  e.x = x;
  e.y = y;
  e.fills = o.fill ? [o.fill] : [];
  if (o.stroke) {
    e.strokes = [solid(o.stroke, 1)];
    e.strokeWeight = 1;
    e.strokeAlign = 'INSIDE';
  }
  parent.appendChild(e);
  return e;
}

function text(str, size, style, color, opts = {}) {
  const t = figma.createText();
  t.fontName = { family: 'Inter', style };
  t.characters = str;
  t.fontSize = size;
  t.fills = [solid(color)];
  if (opts.letterSpacing) t.letterSpacing = { value: opts.letterSpacing, unit: 'PIXELS' };
  if (opts.lineHeight) t.lineHeight = { value: opts.lineHeight * 100, unit: 'PERCENT' };
  if (opts.align) t.textAlignHorizontal = opts.align;
  if (opts.width) {
    t.textAutoResize = 'HEIGHT';
    t.resize(opts.width, t.height);
  } else {
    t.textAutoResize = 'WIDTH_AND_HEIGHT';
  }
  return t;
}

function label(parent, str, x, y, size, style, color, opts = {}) {
  const t = text(str, size, style, color, opts);
  parent.appendChild(t);
  t.x = x;
  t.y = y;
  return t;
}

function badge(parent, str, x, y, o = {}) {
  const { fg = C.dim, bg = C.accent, op = 0.18 } = o;
  const w = Math.max(38, str.length * 6.4 + 18);
  const f = auto('Pill', 'row', 0, 0, solid(bg, op), {
    radius: 999, stroke: bg, strokeOpacity: 0.45, main: 'AUTO', cross: 'FIXED',
    pl: 9, pr: 9, pt: 4, pb: 4,
  });
  const t = text(str, 9, 'Medium', fg, { letterSpacing: 0.3 });
  f.appendChild(t);
  f.resize(w, 21);
  f.primaryAxisSizingMode = 'AUTO';
  parent.appendChild(f);
  f.x = x;
  f.y = y;
  return f;
}

function avatar(parent, initials, x, y, d = 30, copper = false) {
  const a = ellipse(parent, x, y, d, {
    fill: grad(copper ? '#F2C79A' : '#9DB0FF', copper ? '#D99A5C' : '#5B7CFA'),
  });
  const t = text(initials, d * 0.34, 'Semi Bold', '#0B1030', { letterSpacing: 0.2 });
  a.appendChild(t);
  t.x = d / 2 - t.width / 2;
  t.y = d / 2 - t.height / 2;
  return a;
}

function card(parent, x, y, w, h, opts = {}) {
  const f = frame('Card', w, h, solid(C.panel, 0.28), {
    radius: 14,
    stroke: C.line,
    strokeOpacity: 0.14,
  });
  f.effects = [
    { type: 'DROP_SHADOW', color: rgba('#000000', 0.55), offset: { x: 0, y: 24 }, radius: 60, spread: -46, visible: true, blendMode: 'NORMAL' },
    { type: 'INNER_SHADOW', color: rgba(C.ink, 0.04), offset: { x: 0, y: 1 }, radius: 0, spread: 0, visible: true, blendMode: 'NORMAL' },
  ];
  parent.appendChild(f);
  f.x = x;
  f.y = y;
  if (opts.title) {
    label(f, opts.title, 16, 14, 13.5, 'Semi Bold', C.ink);
    if (opts.sub) label(f, opts.sub, 16, 34, 10.5, 'Regular', C.faint);
  }
  return f;
}

/* ---------------- styles ---------------- */
const TOKENS = [
  ['bg', C.bg, 'Fond de l’application'],
  ['bg-elevated', C.bg2, 'Surfaces élevées'],
  ['panel', C.panel, 'Panneaux verre'],
  ['ink', C.ink, 'Texte principal'],
  ['dim', C.dim, 'Texte secondaire'],
  ['faint', C.faint, 'Texte tertiaire'],
  ['line', C.line, 'Filets 1 px'],
  ['accent', C.accent, 'Accent unique'],
  ['accent-soft', C.accent2, 'Accent clair'],
  ['copper', C.copper, 'Alerte douce'],
  ['danger', C.danger, 'Erreur'],
  ['success', C.success, 'Succès'],
];

const TYPE = [
  ['Display / 28', 28, 'Bold', C.ink, 'Titres de page'],
  ['Title / 20', 20, 'Bold', C.ink, 'Titres de section'],
  ['Heading / 15', 15, 'Semi Bold', C.ink, 'Titres de carte'],
  ['Body / 12', 12, 'Regular', C.dim, 'Texte courant'],
  ['Body strong / 12', 12, 'Medium', C.ink, 'Valeurs, noms'],
  ['Caption / 10.5', 10.5, 'Regular', C.faint, 'Sous-titres'],
  ['Label / 9', 9, 'Medium', C.faint, 'Labels uppercase'],
  ['Mono / 10', 10, 'Medium', C.dim, 'Chiffres, références'],
];

async function buildStyles() {
  const colors = TOKENS.map(([name, hex]) => {
    const s = figma.createPaintStyle();
    s.name = `DIALLO/${name}`;
    s.paints = [solid(hex)];
    s.description = `Indigo Minuit · ${hex}`;
    return s;
  });

  for (const [name, size, style, hex] of TYPE) {
    const ts = figma.createTextStyle();
    ts.name = `DIALLO/${name}`;
    ts.fontName = { family: 'Inter', style };
    ts.fontSize = size;
    ts.fills = [solid(hex)];
    ts.letterSpacing = { value: size < 11 ? 0.3 : -0.1, unit: 'PIXELS' };
    ts.lineHeight = { value: size < 11 ? 150 : 130, unit: 'PERCENT' };
  }

  const glow = figma.createEffectStyle();
  glow.name = 'DIALLO/Glow accent';
  glow.effects = [
    { type: 'DROP_SHADOW', color: rgba(C.accent, 0.42), offset: { x: 0, y: 0 }, radius: 40, spread: -14, visible: true, blendMode: 'NORMAL' },
  ];

  const shadow = figma.createEffectStyle();
  shadow.name = 'DIALLO/Card shadow';
  shadow.effects = [
    { type: 'DROP_SHADOW', color: rgba('#000000', 0.55), offset: { x: 0, y: 24 }, radius: 60, spread: -46, visible: true, blendMode: 'NORMAL' },
  ];

  return { colors, styles: TYPE.length, effects: 2 };
}

/* ---------------- composants ---------------- */
function buildComponents(root) {
  const page = figma.createPage();
  page.name = '02 · Composants';
  figma.currentPage = page;

  const board = frame('Composants · Indigo Minuit', 1200, 760, solid(C.bg));
  page.appendChild(board);

  let x = 48, y = 48;
  const section = (title) => {
    label(board, title.toUpperCase(), x, y, 9, 'Medium', C.faint, { letterSpacing: 1.6 });
    y += 26;
  };

  /* boutons */
  section('Boutons');
  const mkBtn = (name, str, solidBg) => {
    const c = figma.createComponent();
    c.name = name;
    c.layoutMode = 'HORIZONTAL';
    c.primaryAxisSizingMode = 'AUTO';
    c.counterAxisSizingMode = 'AUTO';
    c.paddingLeft = 14; c.paddingRight = 14; c.paddingTop = 9; c.paddingBottom = 9;
    c.itemSpacing = 8;
    c.cornerRadius = 9;
    c.fills = solidBg ? [grad(C.accent2, C.accent)] : [solid(C.dim, 0.1)];
    c.strokes = [solid(solidBg ? C.ink : C.line, solidBg ? 0.2 : 0.6)];
    c.strokeWeight = 1;
    c.strokeAlign = 'INSIDE';
    const t = text(str, 12, solidBg ? 'Semi Bold' : 'Regular', solidBg ? C.white : C.ink);
    c.appendChild(t);
    board.appendChild(c);
    return c;
  };
  const b1 = mkBtn('Button / Primaire', 'Enregistrer', true);
  b1.x = x; b1.y = y;
  const b2 = mkBtn('Button / Secondaire', 'Exporter', false);
  b2.x = x + b1.width + 12; b2.y = y;
  y += Math.max(b1.height, b2.height) + 34;

  /* pills */
  section('Statuts');
  const pills = [
    ['Pill / À jour', 'À jour', C.accent, C.dim],
    ['Pill / En retard', 'En retard', C.copper, '#F2C79A'],
    ['Pill / Boursier', 'Boursier', C.accent2, C.dim],
    ['Pill / Payé', 'Payé', C.success, '#BFF0DA'],
  ];
  pills.forEach(([name, str, bg, fg], i) => {
    const c = figma.createComponent();
    c.name = name;
    c.layoutMode = 'HORIZONTAL';
    c.primaryAxisSizingMode = 'AUTO';
    c.counterAxisSizingMode = 'AUTO';
    c.paddingLeft = 10; c.paddingRight = 10; c.paddingTop = 4; c.paddingBottom = 4;
    c.cornerRadius = 999;
    c.fills = [solid(bg, 0.18)];
    c.strokes = [solid(bg, 0.45)];
    c.strokeWeight = 1;
    c.strokeAlign = 'INSIDE';
    c.appendChild(text(str, 9, 'Medium', fg, { letterSpacing: 0.3 }));
    board.appendChild(c);
    c.x = x + i * 96;
    c.y = y;
  });
  y += 46;

  /* avatar */
  section('Avatar');
  ['MD', 'AT', 'IK'].forEach((ini, i) => {
    const c = figma.createComponent();
    c.name = `Avatar / ${ini}`;
    c.resize(34, 34);
    c.cornerRadius = 999;
    c.fills = [grad(i === 2 ? '#F2C79A' : '#9DB0FF', i === 2 ? '#D99A5C' : '#5B7CFA')];
    c.strokes = [solid(C.white, 0.22)];
    c.strokeWeight = 1;
    c.strokeAlign = 'INSIDE';
    const t = text(ini, 11.5, 'Semi Bold', '#0B1030');
    c.appendChild(t);
    t.x = 34 / 2 - t.width / 2;
    t.y = 34 / 2 - t.height / 2;
    board.appendChild(c);
    c.x = x + i * 46;
    c.y = y;
  });
  y += 60;

  /* kpi */
  section('Carte KPI');
  const kpi = figma.createComponent();
  kpi.name = 'KPI / Default';
  kpi.resize(268, 112);
  kpi.cornerRadius = 14;
  kpi.fills = [solid(C.panel, 0.28)];
  kpi.strokes = [solid(C.line, 0.14)];
  kpi.strokeWeight = 1;
  kpi.strokeAlign = 'INSIDE';
  label(kpi, 'Élèves', 15, 14, 11.5, 'Regular', C.dim);
  label(kpi, '1 284', 15, 36, 25, 'Bold', C.ink);
  label(kpi, '+2,4 %', 74, 46, 10, 'Medium', C.accent2);
  rect(kpi, 15, 78, 238, 3, { fill: solid(C.line, 0.2), radius: 999 });
  rect(kpi, 15, 78, 190, 3, { fill: grad(C.accent, C.accent2), radius: 999 });
  label(kpi, 'vs septembre', 15, 88, 10, 'Regular', C.faint);
  board.appendChild(kpi);
  kpi.x = x; kpi.y = y;
  y += 140;

  /* ligne de tableau */
  section('Ligne de tableau');
  const row = figma.createComponent();
  row.name = 'Table / Row';
  row.resize(1040, 48);
  row.fills = [];
  row.strokes = [solid(C.line, 0.12)];
  row.strokeWeight = 1;
  row.strokeAlign = 'INSIDE';
  avatar(row, 'AT', 10, 9, 28);
  label(row, 'Aminata Traoré', 48, 9, 12.5, 'Medium', C.ink);
  label(row, 'Terminale S · 2026-0142', 48, 26, 9.5, 'Regular', C.faint);
  label(row, 'Terminale S', 400, 16, 12, 'Regular', C.dim);
  badge(row, 'À jour', 560, 13, { fg: '#CDD8FF' });
  label(row, '12,80', 700, 16, 11, 'Medium', C.dim);
  label(row, '8,45 M FCFA', 900, 16, 11, 'Medium', C.ink);
  board.appendChild(row);
  row.x = x; row.y = y;

  return page;
}

/* ---------------- écrans ---------------- */
function sidebar(parent, active = 'Tableau de bord') {
  const f = frame('Sidebar', SIDEBAR, H - TOPBAR, solid(C.bg, 0.55), { stroke: C.line, strokeOpacity: 0.14 });
  f.fills = [grad(C.panel, C.bg, 0.3)];
  parent.appendChild(f);
  f.x = 0;
  f.y = TOPBAR;

  rect(f, 16, 20, 30, 30, { fill: grad(C.accent2, C.accent), radius: 9 });
  rect(f, 24, 28, 15, 14, { fill: solid(C.bg), radius: 3 });
  label(f, 'DIALLO', 58, 20, 14, 'Bold', C.ink, { letterSpacing: 0.7 });
  label(f, 'ÉCOLE INTERNATIONALE', 58, 38, 7.5, 'Medium', C.faint, { letterSpacing: 1.2 });

  const groups = [
    ['PILOTAGE', ['Tableau de bord', 'Élèves', 'Classes', 'Emploi du temps']],
    ['GESTION', ['Finances', 'Personnel', 'Messagerie']],
    ['PÉDAGOGIE', ['Matières', 'Notes', 'Absences', 'Fiche élève', 'Admissions']],
    ['SYSTÈME', ['Paramètres']],
  ];

  let y = 78;
  groups.forEach(([g, items]) => {
    label(f, g, 24, y, 8, 'Medium', C.faint, { letterSpacing: 1.4 });
    y += 18;
    items.forEach((it) => {
      const on = it === active;
      if (on) {
        rect(f, 12, y - 4, 214, 34, { fill: solid(C.accent, 0.22), radius: 10, stroke: C.accent, strokeOpacity: 0.4 });
        rect(f, 12, y + 4, 2, 18, { fill: solid(C.accent), radius: 2 });
      }
      ellipse(f, 24, y + 7, 12, { stroke: on ? C.accent2 : C.faint, fill: null });
      label(f, it, 46, y + 6, 12.5, on ? 'Medium' : 'Regular', on ? C.white : C.dim);
      y += 34;
    });
    y += 10;
  });

  rect(f, 12, H - TOPBAR - 66, 214, 50, { fill: solid(C.ink, 0.06), radius: 12, stroke: C.line, strokeOpacity: 0.3 });
  avatar(f, 'MD', 24, H - TOPBAR - 54, 26);
  label(f, 'M. Diallo', 60, H - TOPBAR - 56, 11.5, 'Medium', C.ink);
  label(f, 'Direction', 60, H - TOPBAR - 40, 8.5, 'Regular', C.faint);

  return f;
}

function topbar(parent, crumbA, crumbB) {
  const f = frame('Topbar', W, TOPBAR, solid(C.bg2, 0.6), { stroke: C.line, strokeOpacity: 0.14 });
  parent.appendChild(f);
  f.x = 0;
  f.y = 0;

  label(f, crumbA.toUpperCase(), SIDEBAR + 22, 21, 9.5, 'Medium', C.faint, { letterSpacing: 1.2 });
  label(f, '·', SIDEBAR + 22 + crumbA.length * 7, 21, 9.5, 'Regular', C.faint);
  label(f, crumbB.toUpperCase(), SIDEBAR + 36 + crumbA.length * 7, 21, 9.5, 'Medium', C.dim, { letterSpacing: 1.2 });

  rect(f, W - 470, 12, 300, 30, { fill: solid(C.line, 0.08), radius: 9, stroke: C.line, strokeOpacity: 0.4 });
  ellipse(f, W - 458, 22, 11, { stroke: C.faint });
  label(f, 'Rechercher une page…', W - 440, 20, 11.5, 'Regular', C.faint);

  rect(f, W - 156, 12, 30, 30, { fill: solid(C.line, 0.08), radius: 9, stroke: C.line, strokeOpacity: 0.4 });
  ellipse(f, W - 147, 21, 12, { stroke: C.dim });
  ellipse(f, W - 134, 14, 6, { fill: solid(C.copper) });
  avatar(f, 'MD', W - 108, 11, 32);

  return f;
}

function pageHead(parent, title, sub, primary, secondary) {
  label(parent, title, SIDEBAR + 22, 76, 26, 'Bold', C.ink, { letterSpacing: -0.5 });
  label(parent, sub, SIDEBAR + 22, 112, 12, 'Regular', C.dim);

  const bw = Math.max(96, primary.length * 7.4 + 30);
  const btn = rect(parent, W - 22 - bw, 74, bw, 34, { fill: grad(C.accent2, C.accent), radius: 9, stroke: C.white, strokeOpacity: 0.2 });
  const bt = label(parent, primary, 0, 0, 12, 'Semi Bold', C.white);
  bt.x = W - 22 - bw + (bw - bt.width) / 2;
  bt.y = 74 + 17 - bt.height / 2;

  const sw = Math.max(84, secondary.length * 6.6 + 28);
  rect(parent, W - 34 - bw - sw, 74, sw, 34, { fill: solid(C.line, 0.08), radius: 9, stroke: C.line, strokeOpacity: 0.5 });
  const st = label(parent, secondary, 0, 0, 11.5, 'Regular', C.ink);
  st.x = W - 34 - bw - sw + (sw - st.width) / 2;
  st.y = 74 + 17 - st.height / 2;

  return btn;
}

function kpiRow(parent, items, y) {
  const gap = 12;
  const w = (W - SIDEBAR - 44 - gap * (items.length - 1)) / items.length;
  items.forEach((it, i) => {
    const x = SIDEBAR + 22 + i * (w + gap);
    const c = card(parent, x, y, w, 106);
    label(c, it.label, 15, 14, 11.5, 'Regular', C.dim);
    label(c, it.value, 15, 38, 24, 'Bold', C.ink, { letterSpacing: -0.4 });
    if (it.unit) label(c, it.unit, 15 + it.value.length * 14, 48, 10, 'Medium', C.faint);
    if (it.progress !== undefined) {
      rect(c, 15, 80, w - 30, 3, { fill: solid(C.line, 0.2), radius: 999 });
      rect(c, 15, 80, (w - 30) * (it.progress / 100), 3, { fill: grad(C.accent, C.accent2), radius: 999 });
    }
    if (it.delta) badge(c, it.delta, w - 68, 15, { fg: '#CDD8FF' });
    if (it.dot) ellipse(c, w - 26, 16, 7, { fill: solid(C.copper) });
    if (it.hint) label(c, it.hint, 15, 86, 10, 'Regular', C.faint);
  });
  return w;
}

function tableCard(parent, x, y, w, h, title, sub, rows, cols) {
  const c = card(parent, x, y, w, h, { title, sub });
  const headY = title ? 68 : 20;
  cols.forEach((col) => {
    label(c, col.label.toUpperCase(), col.x, headY, 8.5, 'Medium', C.faint, { letterSpacing: 1.4 });
  });
  rect(c, 16, headY + 22, w - 32, 1, { fill: solid(C.line, 0.16) });

  rows.forEach((r, i) => {
    const ry = headY + 26 + i * 48;
    rect(c, 16, ry + 46, w - 32, 1, { fill: solid(C.line, 0.08) });
    avatar(c, r.initials, 16, ry + 9, 28);
    label(c, r.name, 52, ry + 7, 12.5, 'Medium', C.ink);
    label(c, r.sub, 52, ry + 24, 9.5, 'Regular', C.faint);
    cols.slice(1).forEach((col) => {
      if (col.kind === 'pill') badge(c, r.pill, col.x, ry + 13, { fg: '#CDD8FF' });
      else label(c, r[col.key] || '', col.x, ry + 15, 11.5, 'Regular', C.dim);
    });
  });
  return c;
}

/* --- écran : tableau de bord --- */
function screenDashboard(dsPage) {
  const s = frame('01 · Tableau de bord', W, H, solid(C.bg));
  dsPage.appendChild(s);
  sidebar(s, 'Tableau de bord');
  topbar(s, 'Tableau de bord', 'Semestre 1');
  pageHead(s, 'Tableau de bord', 'Lundi 27 octobre · 42 classes actives', 'Nouvel élève', 'Exporter');

  kpiRow(s, [
    { label: 'Élèves', value: '1 284', delta: '+2,4 %', hint: 'vs septembre' },
    { label: 'Présence', value: '96,8 %', progress: 96.8, hint: 'moyenne 30 jours' },
    { label: 'Recouvrement', value: '8,45 M', unit: 'FCFA', hint: 'exercice 2026' },
    { label: 'Classes', value: '42', hint: 'dont 6 terminales', dot: true },
  ], 148);

  /* graphique */
  const chart = card(s, SIDEBAR + 22, 270, W - SIDEBAR - 372, 268, {
    title: 'Recouvrement mensuel',
    sub: 'Exercice 2026 · millions de FCFA',
  });
  const gx = 16, gy = 62, gw = chart.width - 32, gh = 150;
  [0.25, 0.5, 0.75, 1].forEach((g) => {
    rect(chart, gx, gy + gh - g * gh, gw, 1, { fill: solid(C.line, 0.1) });
  });
  rect(chart, gx, gy + gh, gw, 1, { fill: solid(C.line, 0.2) });
  const pts = [0.28, 0.35, 0.31, 0.42, 0.5, 0.46, 0.44, 0.58, 0.55, 0.7, 0.66, 0.82];
  pts.forEach((p, i) => {
    const bh = p * gh;
    rect(chart, gx + i * (gw / 12) + 6, gy + gh - bh, gw / 12 - 12, bh, {
      fill: grad(C.accent2, C.accent, 0.85),
      radius: 4,
    });
  });
  ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'].forEach((m, i) => {
    label(chart, m, gx + i * (gw / 12) + 4, gy + gh + 10, 9, 'Regular', C.faint);
  });

  /* aujourd'hui */
  const today = card(s, W - 338, 270, 316, 268, { title: 'Aujourd’hui', sub: '3 cours · Terminale S' });
  ['Mathématiques', 'Physique-Chimie', 'Français'].forEach((sub, i) => {
    const ry = 58 + i * 58;
    rect(today, 16, ry + 50, today.width - 32, 1, { fill: solid(C.line, 0.09) });
    avatar(today, ['AM', 'CD', 'PT'][i], 16, ry, 30, i === 2);
    label(today, sub, 56, ry + 4, 12.5, 'Medium', C.ink);
    label(today, ['Salle 204', 'Labo A', 'Salle 112'][i], 56, ry + 21, 10, 'Regular', C.faint);
    label(today, ['08:00', '10:00', '14:00'][i], today.width - 62, ry + 9, 11, 'Medium', C.accent2);
  });
  rect(today, 16, 236, 120, 3, { fill: grad(C.accent, C.accent2), radius: 999 });
  label(today, '62 % de la journée', 146, 231, 10, 'Regular', C.faint);

  /* moyennes par matière */
  const mat = card(s, W - 338, 552, 316, 326, { title: 'Moyennes par matière', sub: 'Terminale S · trimestre 1' });
  const subjects = [
    ['Mathématiques', 13.4, C.accent2],
    ['Physique-Chimie', 12.1, C.accent2],
    ['Français', 14.2, C.success],
    ['Anglais', 13.8, C.success],
    ['Histoire-Géo', 11.9, C.copper],
  ];
  subjects.forEach(([name, avg, tone], i) => {
    const y = 58 + i * 48;
    label(mat, name, 16, y, 11.5, 'Medium', C.ink);
    label(mat, avg.toFixed(1).replace('.', ','), mat.width - 62, y - 1, 12, 'Medium', tone);
    rect(mat, 16, y + 22, mat.width - 32, 3, { fill: solid(C.line, 0.16), radius: 999 });
    rect(mat, 16, y + 22, (mat.width - 32) * (avg / 20), 3, { fill: solid(tone), radius: 999 });
    if (i < subjects.length - 1) rect(mat, 16, y + 40, mat.width - 32, 1, { fill: solid(C.line, 0.07) });
  });
  rect(mat, 16, 298, mat.width - 32, 1, { fill: solid(C.line, 0.16) });
  label(mat, 'MOYENNE GÉNÉRALE', 16, 306, 8.5, 'Medium', C.faint, { letterSpacing: 1.4 });
  label(mat, '13,08', mat.width - 62, 302, 13, 'Bold', C.ink);

  /* table */
  tableCard(s, SIDEBAR + 22, 552, W - SIDEBAR - 372, 326, 'Élèves récents', '1 284 élèves inscrits', [
    { initials: 'AT', name: 'Aminata Traoré', sub: '2026-0142', cls: 'Terminale S', pill: 'À jour', avg: '12,80', solde: '8,45 M FCFA' },
    { initials: 'IK', name: 'Ibrahim Konaté', sub: '2026-0143', cls: 'Terminale S', pill: 'En retard', avg: '11,20', solde: '47 000 FCFA' },
    { initials: 'FD', name: 'Fatoumata Diallo', sub: '2026-0151', cls: 'Première S', pill: 'À jour', avg: '14,60', solde: '0 FCFA' },
    { initials: 'MC', name: 'Moussa Camara', sub: '2026-0164', cls: 'Seconde A', pill: 'Boursier', avg: '13,10', solde: '0 FCFA' },
    { initials: 'AS', name: 'Awa Sow', sub: '2026-0177', cls: 'Terminale L', pill: 'À jour', avg: '15,40', solde: '120 000 FCFA' },
  ], [
    { label: 'Élève', x: 16 },
    { label: 'Classe', x: 296, key: 'cls' },
    { label: 'Statut', x: 412, kind: 'pill' },
    { label: 'Moyenne', x: 536, key: 'avg' },
    { label: 'Solde', x: 648, key: 'solde' },
  ]);

  return s;
}

/* --- écran : élèves --- */
function screenEleves(dsPage) {
  const s = frame('02 · Élèves', W, H, solid(C.bg));
  dsPage.appendChild(s);
  sidebar(s, 'Élèves');
  topbar(s, 'Élèves', 'Tous les élèves');
  pageHead(s, 'Élèves', '1 284 élèves · 42 classes', 'Nouvel élève', 'Importer');

  const tabs = ['Tous', 'Terminale', 'Première', 'Seconde', 'Boursiers'];
  let tx = SIDEBAR + 22;
  tabs.forEach((t, i) => {
    const w = t.length * 6.6 + 24;
    rect(s, tx, 150, w, 30, { fill: i === 0 ? solid(C.accent) : solid(C.line, 0.06), radius: 999, stroke: C.line, strokeOpacity: i === 0 ? 0 : 0.4 });
    label(s, t, tx + 12, 158, 11.5, i === 0 ? 'Semi Bold' : 'Regular', i === 0 ? C.white : C.dim);
    tx += w + 6;
  });
  label(s, '1 284 RÉSULTATS', W - 240, 160, 9.5, 'Medium', C.faint, { letterSpacing: 1.2 });

  tableCard(s, SIDEBAR + 22, 200, W - SIDEBAR - 44, 660, '', '', [
    { initials: 'AT', name: 'Aminata Traoré', sub: 'Terminale S · 2026-0142', cls: 'Terminale S', pill: 'À jour', avg: '12,80', solde: '8,45 M FCFA' },
    { initials: 'IK', name: 'Ibrahim Konaté', sub: 'Terminale S · 2026-0143', cls: 'Terminale S', pill: 'En retard', avg: '11,20', solde: '47 000 FCFA' },
    { initials: 'FD', name: 'Fatoumata Diallo', sub: 'Première S · 2026-0151', cls: 'Première S', pill: 'À jour', avg: '14,60', solde: '0 FCFA' },
    { initials: 'MC', name: 'Moussa Camara', sub: 'Seconde A · 2026-0164', cls: 'Seconde A', pill: 'Boursier', avg: '13,10', solde: '0 FCFA' },
    { initials: 'AS', name: 'Awa Sow', sub: 'Terminale L · 2026-0177', cls: 'Terminale L', pill: 'À jour', avg: '15,40', solde: '120 000 FCFA' },
    { initials: 'SK', name: 'Seydou Keïta', sub: 'Première ES · 2026-0188', cls: 'Première ES', pill: 'En retard', avg: '9,80', solde: '30 000 FCFA' },
    { initials: 'NB', name: 'Nafissatou Bâ', sub: 'Seconde B · 2026-0192', cls: 'Seconde B', pill: 'À jour', avg: '16,20', solde: '0 FCFA' },
    { initials: 'OS', name: 'Oumar Sy', sub: 'Terminale S · 2026-0201', cls: 'Terminale S', pill: 'À jour', avg: '13,75', solde: '60 000 FCFA' },
  ], [
    { label: 'Élève', x: 16 },
    { label: 'Classe', x: 430, key: 'cls' },
    { label: 'Statut', x: 560, kind: 'pill' },
    { label: 'Moyenne', x: 690, key: 'avg' },
    { label: 'Solde', x: 830, key: 'solde' },
  ]);

  return s;
}

/* --- écran : finances --- */
function screenFinances(dsPage) {
  const s = frame('06 · Finances', W, H, solid(C.bg));
  dsPage.appendChild(s);
  sidebar(s, 'Finances');
  topbar(s, 'Finances', 'Octobre 2026');
  pageHead(s, 'Finances', 'Recouvrement · Exercice 2026', 'Enregistrer un paiement', 'Exporter');

  kpiRow(s, [
    { label: 'Recouvrement', value: '8,45 M', unit: 'FCFA', hint: 'exercice 2026' },
    { label: 'Impayés', value: '420 000', unit: 'FCFA', hint: '24 dossiers', dot: true },
    { label: 'Taux', value: '92,4 %', progress: 92.4, hint: '+1,8 pt vs septembre' },
  ], 148);

  const chart = card(s, SIDEBAR + 22, 270, W - SIDEBAR - 372, 250, { title: 'Recouvrement mensuel', sub: 'Millions de FCFA' });
  [0.25, 0.5, 0.75, 1].forEach((g) => rect(chart, 16, 62 + 140 - g * 140, chart.width - 32, 1, { fill: solid(C.line, 0.1) }));
  [0.3, 0.4, 0.34, 0.48, 0.55, 0.5, 0.46, 0.62, 0.58, 0.74, 0.7, 0.88].forEach((p, i) => {
    const w = (chart.width - 32) / 12;
    rect(chart, 16 + i * w + 6, 62 + 140 - p * 140, w - 12, p * 140, { fill: grad(C.accent2, C.accent, 0.85), radius: 4 });
  });

  const donut = card(s, W - 338, 270, 316, 250, { title: 'Répartition', sub: 'Par nature de frais' });
  const parts = [['Scolarité', 58, C.accent], ['Cantine', 24, C.accent2], ['Transport', 12, C.copper], ['Autres', 6, C.faint]];
  let dy = 64;
  parts.forEach(([name, v, col]) => {
    rect(donut, 16, dy, 170, 6, { fill: solid(C.line, 0.1), radius: 999 });
    rect(donut, 16, dy, 170 * (v / 58), 6, { fill: solid(col, 0.9), radius: 999 });
    label(donut, name, 16, dy + 12, 10.5, 'Regular', C.dim);
    label(donut, `${v} %`, 250, dy - 2, 10.5, 'Medium', C.ink);
    dy += 42;
  });

  tableCard(s, SIDEBAR + 22, 534, W - SIDEBAR - 44, 344, 'Derniers paiements', 'Octobre 2026', [
    { initials: 'AT', name: 'Aminata Traoré', sub: '28/02/2026', cls: 'Frais de scolarité', pill: 'Payé', avg: '8,45 M', solde: 'Payé' },
    { initials: 'IK', name: 'Ibrahim Konaté', sub: '20/02/2026', cls: 'Cantine', pill: 'En retard', avg: '47 000 F', solde: 'En attente' },
    { initials: 'FD', name: 'Fatoumata Diallo', sub: '23/02/2026', cls: 'Transport', pill: 'Payé', avg: '20 000 F', solde: 'Payé' },
    { initials: 'MC', name: 'Moussa Camara', sub: '23/02/2026', cls: 'Scolarité', pill: 'Payé', avg: '30 100 F', solde: 'Payé' },
    { initials: 'AS', name: 'Awa Sow', sub: '23/02/2026', cls: 'Cantine', pill: 'En retard', avg: '10 000 F', solde: 'En attente' },
  ], [
    { label: 'Élève', x: 16 },
    { label: 'Motif', x: 400, key: 'cls' },
    { label: 'Date', x: 640, key: 'sub' },
    { label: 'Montant', x: 800, key: 'avg' },
    { label: 'Statut', x: 930, kind: 'pill' },
  ]);

  return s;
}

/* --- écran : emploi du temps --- */
function screenTimetable(dsPage) {
  const s = frame('05 · Emploi du temps', W, H, solid(C.bg));
  dsPage.appendChild(s);
  sidebar(s, 'Emploi du temps');
  topbar(s, 'Emploi du temps', 'Semaine 44');
  pageHead(s, 'Emploi du temps', 'Semaine du 27 octobre au 1er novembre', 'Ajouter un cours', 'Exporter l’ICS');

  const cardX = SIDEBAR + 22;
  const cardY = 148;
  const cardW = W - SIDEBAR - 44;
  const c = card(s, cardX, cardY, cardW, 640);

  const days = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI'];
  const hours = ['08:00', '10:00', '12:00', '14:00', '16:00'];
  const colW = (cardW - 32 - 74) / 5;
  const rowH = 108;

  days.forEach((d, i) => {
    label(c, d, 16 + 74 + i * colW + colW / 2 - d.length * 3.4, 22, 9.5, 'Medium', i === 3 ? C.accent2 : C.faint, { letterSpacing: 1.4 });
  });
  rect(c, 16, 44, cardW - 32, 1, { fill: solid(C.line, 0.16) });

  hours.forEach((h, r) => {
    label(c, h, 16, 58 + r * rowH, 9.5, 'Regular', C.faint);
    for (let d = 0; d < 5; d++) {
      rect(c, 16 + 74 + d * colW + 3, 50 + r * rowH, colW - 6, rowH - 8, { fill: solid(C.line, 0.035), radius: 9 });
    }
  });

  const slots = [
    [0, 0, 'Mathématiques', 'S204', 'a'], [0, 1, 'Physique', 'Labo A', 'b'], [0, 3, 'Français', 'S112', 'c'],
    [1, 0, 'Histoire', 'S101', 'b'], [1, 1, 'Anglais', 'S303', 'a'], [1, 2, 'SVT', 'Labo B', 'c'],
    [2, 0, 'Mathématiques', 'S204', 'a'], [2, 3, 'EPS', 'Gymnase', 'c'],
    [3, 0, 'Philosophie', 'S205', 'b'], [3, 1, 'Mathématiques', 'S204', 'live'], [3, 2, 'Anglais', 'S303', 'c'], [3, 3, 'Physique', 'Labo A', 'b'],
    [4, 0, 'Français', 'S112', 'c'], [4, 2, 'Informatique', 'Salle info', 'a'], [4, 4, 'Conseil de classe', 'Bureau 10', 'b'],
  ];

  const tones = {
    a: { fill: solid(C.accent, 0.26), stroke: C.accent, op: 0.45, fg: '#EEF2FF' },
    b: { fill: solid(C.accent2, 0.16), stroke: C.accent2, op: 0.3, fg: '#DFE6FF' },
    c: { fill: solid(C.copper, 0.14), stroke: C.copper, op: 0.3, fg: '#FFE6CB' },
    live: { fill: solid(C.accent, 0.42), stroke: C.accent2, op: 0.9, fg: '#FFFFFF' },
  };

  slots.forEach(([d, r, sub, room, tone]) => {
    const t = tones[tone];
    const x = 16 + 74 + d * colW + 3;
    const y = 50 + r * rowH;
    const box = rect(c, x, y, colW - 6, rowH - 8, { fill: t.fill, radius: 9, stroke: t.stroke, strokeOpacity: t.op });
    label(c, sub, x + 10, y + 12, 11.5, 'Medium', t.fg, { width: colW - 26 });
    label(c, room, x + 10, y + rowH - 26, 9, 'Regular', t.fg);
    if (tone === 'live') {
      rect(c, x + 6, y + rowH - 10, colW - 18, 1, { fill: solid(C.copper) });
    }
  });

  const legendY = 812;
  [['Mathématiques', C.accent, 0.7], ['Sciences', C.accent2, 0.5], ['Lettres', C.copper, 0.6]].forEach(([lab, col, op], i) => {
    rect(s, SIDEBAR + 22 + i * 150, legendY, 10, 10, { fill: solid(col, op), radius: 3 });
    label(s, lab, SIDEBAR + 38 + i * 150, legendY - 1, 10.5, 'Regular', C.faint);
  });
  rect(s, SIDEBAR + 22 + 3 * 150, legendY + 4, 14, 2, { fill: solid(C.copper) });
  label(s, 'Cours en cours', SIDEBAR + 22 + 3 * 150 + 20, legendY - 1, 10.5, 'Regular', C.faint);

  return s;
}

/* --- écran : paramètres --- */
function screenSettings(dsPage) {
  const s = frame('13 · Paramètres', W, H, solid(C.bg));
  dsPage.appendChild(s);
  sidebar(s, 'Paramètres');
  topbar(s, 'Paramètres', 'Établissement');
  pageHead(s, 'Paramètres', 'Établissement · Compte · Notifications', 'Enregistrer', 'Réinitialiser');

  const nav = card(s, SIDEBAR + 22, 148, 196, 250);
  ['Établissement', 'Année scolaire', 'Comptes', 'Notifications', 'Sauvegardes', 'Sécurité'].forEach((item, i) => {
    const y = 14 + i * 36;
    if (i === 0) rect(nav, 10, y - 4, 176, 32, { fill: solid(C.accent, 0.2), radius: 8, stroke: C.accent, strokeOpacity: 0.4 });
    label(nav, item, 20, y + 4, 12, i === 0 ? 'Medium' : 'Regular', i === 0 ? C.white : C.dim);
  });

  const form = card(s, SIDEBAR + 238, 148, W - SIDEBAR - 260, 400, {
    title: 'Établissement',
    sub: 'Informations publiques',
  });
  const fields = [
    ['Nom de l’établissement', 'École Internationale Diallo'],
    ['Adresse', 'Hamdallaye ACI 2000, Bamako'],
    ['Téléphone', '+223 20 00 00 00'],
    ['E-mail', 'contact@diallo.ml'],
    ['Devise', 'FCFA'],
    ['Langue', 'Français'],
  ];
  fields.forEach(([lab, val], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 16 + col * ((form.width - 44) / 2 + 12);
    const y = 62 + row * 74;
    label(form, lab, x, y, 10.5, 'Regular', C.faint);
    rect(form, x, y + 16, (form.width - 44) / 2, 34, { fill: solid(C.line, 0.06), radius: 9, stroke: C.line, strokeOpacity: 0.5 });
    label(form, val, x + 11, y + 26, 12, 'Regular', C.ink);
  });

  rect(form, 16, 296, form.width - 32, 1, { fill: solid(C.line, 0.16) });
  label(form, 'Notifications e-mail', 16, 314, 12, 'Regular', C.dim);
  rect(form, 168, 311, 38, 21, { fill: solid(C.accent), radius: 999 });
  ellipse(form, 187, 313, 17, { fill: solid('#E8EDFF') });
  label(form, 'Rappels de paiement', 240, 314, 12, 'Regular', C.dim);
  rect(form, 392, 311, 38, 21, { fill: solid(C.line, 0.16), radius: 999 });
  ellipse(form, 394, 313, 17, { fill: solid('#E8EDFF') });

  const danger = card(s, SIDEBAR + 238, 566, W - SIDEBAR - 260, 200, {
    title: 'Année scolaire',
    sub: '2025 — 2026',
  });
  ['Début · 01/09/2025', 'Fin · 30/06/2026'].forEach((v, i) => {
    rect(danger, 16 + i * 200, 62, 188, 34, { fill: solid(C.line, 0.06), radius: 9, stroke: C.line, strokeOpacity: 0.5 });
    label(danger, v, 27 + i * 200, 72, 11.5, 'Regular', C.ink);
  });
  const zone = rect(danger, 16, 120, danger.width - 32, 62, {
    fill: solid(C.copper, 0.08), radius: 10, stroke: C.copper, strokeOpacity: 0.3,
  });
  label(danger, 'Zone sensible', 30, 132, 12, 'Medium', '#F6D3B0');
  label(danger, 'Réinitialiser les données de démonstration', 30, 150, 10.5, 'Regular', '#C9A887');
  rect(danger, danger.width - 130, 138, 100, 30, { fill: solid(C.line, 0.1), radius: 8, stroke: C.line, strokeOpacity: 0.5 });
  label(danger, 'Réinitialiser', danger.width - 120, 146, 10.5, 'Regular', C.ink);

  return s;
}

/* --- écran : classes --- */
function screenClasses(dsPage) {
  const s = frame('03 · Classes', W, H, solid(C.bg));
  dsPage.appendChild(s);
  sidebar(s, 'Classes');
  topbar(s, 'Classes', 'Année 2025–2026');
  pageHead(s, 'Classes', '42 classes · 1 284 élèves', 'Créer une classe', 'Archiver');

  const stats = [['42', 'Classes'], ['31,2', 'Élèves / classe'], ['96,8 %', 'Taux d’occupation'], ['6', 'Terminales']];
  const sw = (W - SIDEBAR - 44 - 36) / 4;
  stats.forEach(([v, l], i) => {
    const x = SIDEBAR + 22 + i * (sw + 12);
    const c = card(s, x, 148, sw, 74);
    label(c, v, 15, 14, 21, 'Bold', i === 2 ? C.accent2 : C.ink);
    label(c, l, 15, 45, 11, 'Regular', C.faint);
  });

  const names = ['Terminale S', 'Terminale L', 'Première S', 'Première ES', 'Seconde A', 'Seconde B'];
  const teachers = ['M. Martior', 'Mme Diallo', 'M. Hilorma', 'Mme Traoré', 'M. Framiéma', 'Mme Rifa'];
  const cw = (W - SIDEBAR - 44 - 24) / 3;

  names.forEach((n, i) => {
    const x = SIDEBAR + 22 + (i % 3) * (cw + 12);
    const y = 240 + Math.floor(i / 3) * 200;
    const c = card(s, x, y, cw, 184);
    if (i === 4) {
      c.strokes = [solid(C.accent, 0.55)];
      c.effects = [
        { type: 'DROP_SHADOW', color: rgba(C.accent, 0.3), offset: { x: 0, y: 0 }, radius: 40, spread: -14, visible: true, blendMode: 'NORMAL' },
      ];
    }
    label(c, n, 16, 15, 16, 'Bold', C.ink);
    if (i === 4) badge(c, 'Active', cw - 76, 16, { fg: '#CDD8FF' });
    label(c, 'Effectif', 16, 52, 10.5, 'Regular', C.faint);
    label(c, '32', cw - 60, 48, 13, 'Medium', C.ink);
    label(c, '/ 35', cw - 32, 51, 10, 'Regular', C.faint);
    rect(c, 16, 74, cw - 32, 3, { fill: solid(C.line, 0.18), radius: 999 });
    rect(c, 16, 74, (cw - 32) * 0.91, 3, { fill: grad(C.accent, C.accent2), radius: 999 });
    ['AM', 'IK', 'FD'].forEach((ini, k) => {
      ellipse(c, 16 + k * 16, 94, 22, { fill: grad('#9DB0FF', '#5B7CFA'), stroke: C.bg2 });
    });
    rect(c, 16, 136, cw - 32, 1, { fill: solid(C.line, 0.16) });
    label(c, teachers[i], 16, 148, 11.5, 'Regular', C.dim);
    ellipse(c, cw - 30, 150, 5, { fill: solid(C.faint) });
  });

  return s;
}

/* --- écran : notes --- */
function screenNotes(dsPage) {
  const s = frame('09 · Notes', W, H, solid(C.bg));
  dsPage.appendChild(s);
  sidebar(s, 'Notes');
  topbar(s, 'Élèves', 'Notes · Trimestre 1');
  pageHead(s, 'Notes', 'Terminale S · Trimestre 1 · 32 élèves', 'Saisir les notes', 'Bulletins');

  const stats = [['12,8 / 20', 'Moyenne de classe', true], ['18,4', 'Meilleure moyenne'], ['12,1', 'Médiane'], ['6,2 %', 'Sous la moyenne']];
  const sw = (W - SIDEBAR - 44 - 36) / 4;
  stats.forEach(([v, l, acc], i) => {
    const c = card(s, SIDEBAR + 22 + i * (sw + 12), 148, sw, 74);
    label(c, v, 15, 14, 21, 'Bold', acc ? C.accent2 : C.ink);
    label(c, l, 15, 45, 11, 'Regular', C.faint);
  });

  const rep = card(s, SIDEBAR + 22, 240, 360, 230, { title: 'Répartition', sub: 'Tranches de notes' });
  [['0–5', 8], ['5–10', 22], ['10–15', 46], ['15–18', 20], ['18–20', 4]].forEach(([lab, v], i) => {
    const y = 64 + i * 30;
    label(rep, lab, 16, y + 4, 11, 'Regular', C.dim);
    rect(rep, 70, y + 8, 200, 5, { fill: solid(C.line, 0.1), radius: 999 });
    rect(rep, 70, y + 8, 200 * (v / 46), 5, { fill: grad(C.accent, C.accent2), radius: 999 });
    label(rep, v + ' %', 288, y + 4, 10, 'Medium', C.faint);
  });

  const grades = [
    ['Aminata Traoré', '16,0', '14,5', '15,0', '15,20', 'Excellent'],
    ['Ibrahim Konaté', '11,0', '9,5', '12,0', '10,85', 'Passable'],
    ['Fatoumata Diallo', '18,0', '17,0', '16,5', '17,15', 'Excellent'],
    ['Moussa Camara', '13,0', '12,0', '11,5', '12,15', 'Bien'],
    ['Awa Sow', '9,0', '8,0', '7,5', '8,15', 'Insuffisant'],
    ['Seydou Keïta', '12,0', '13,5', '12,0', '12,50', 'Bien'],
  ];

  const t = card(s, SIDEBAR + 22, 490, W - SIDEBAR - 44, 380, { title: 'Notes · Terminale S', sub: 'Trimestre 1' });
  ['ÉLÈVE', 'DEVOIR 1', 'DEVOIR 2', 'COMPOSITION', 'MOYENNE', 'APPRÉCIATION'].forEach((h, i) => {
    label(t, h, [16, 400, 520, 640, 800, 920][i], 56, 8.5, 'Medium', C.faint, { letterSpacing: 1.4 });
  });
  rect(t, 16, 78, t.width - 32, 1, { fill: solid(C.line, 0.16) });

  grades.forEach((g, i) => {
    const y = 92 + i * 46;
    rect(t, 16, y + 42, t.width - 32, 1, { fill: solid(C.line, 0.08) });
    avatar(t, g[0].split(' ').map((w) => w[0]).join(''), 16, y + 7, 26);
    label(t, g[0], 52, y + 12, 12, 'Medium', C.ink);
    label(t, g[1], 400, y + 12, 11.5, 'Regular', C.dim);
    label(t, g[2], 520, y + 12, 11.5, 'Regular', C.dim);
    label(t, g[3], 640, y + 12, 11.5, 'Regular', C.dim);
    label(t, g[4], 800, y + 12, 11.5, 'Medium', C.ink);
    badge(t, g[5], 920, y + 8, { fg: g[5] === 'Insuffisant' ? '#FFC9C9' : '#CDD8FF', bg: g[5] === 'Insuffisant' ? C.danger : C.accent });
  });

  return s;
}

/* --- écran : admissions (kanban) --- */
function screenAdmissions(dsPage) {
  const s = frame('12 · Admissions', W, H, solid(C.bg));
  dsPage.appendChild(s);
  sidebar(s, 'Admissions');
  topbar(s, 'Admissions', 'Rentrée 2026');
  pageHead(s, 'Admissions', 'Rentrée 2026 · 128 dossiers en cours', 'Nouveau dossier', 'Exporter');

  const stats = [['128', 'Dossiers'], ['64', 'Validés', true], ['12', 'En attente'], ['41', 'Entretiens']];
  const sw = (W - SIDEBAR - 44 - 36) / 4;
  stats.forEach(([v, l, acc], i) => {
    const c = card(s, SIDEBAR + 22 + i * (sw + 12), 148, sw, 74);
    label(c, v, 15, 14, 21, 'Bold', acc ? C.accent2 : C.ink);
    label(c, l, 15, 45, 11, 'Regular', C.faint);
  });

  const cols = [
    ['NOUVEAU', '34', ['Aminata Cissé', 'Ibrahim Traoré', 'Fatou Diallo']],
    ['ENTRETIEN', '41', ['Moussa Bâ', 'Awa Konaté', 'Seydou Sow']],
    ['VALIDÉ', '41', ['Nafissatou Sy', 'Oumar Barry', 'Kadidia Camara']],
    ['INSCRIT', '12', ['Mariam Traoré', 'Jean Cissé', 'Aminata Sow']],
  ];
  const cw = (W - SIDEBAR - 44 - 30) / 4;

  cols.forEach(([title, count, names], ci) => {
    const x = SIDEBAR + 22 + ci * (cw + 10);
    const col = frame(`Colonne ${title}`, cw, 540, solid(C.panel, 0.18), { radius: 12, stroke: C.line, strokeOpacity: 0.16 });
    s.appendChild(col);
    col.x = x;
    col.y = 240;

    label(col, title, 12, 12, 9, 'Medium', C.dim, { letterSpacing: 1.4 });
    label(col, count, cw - 30, 12, 10, 'Medium', C.faint);
    rect(col, 12, 32, cw - 24, 1, { fill: solid(C.line, 0.2) });
    rect(col, 12, 32, cw - 24, 1, { fill: solid(C.accent, 0.55) });

    names.forEach((n, k) => {
      const cardY = 46 + k * 96;
      const lifted = ci === 1 && k === 1;
      const c = frame('Carte dossier', cw - 24, 86, solid(C.panel, 0.34), {
        radius: 10,
        stroke: lifted ? C.accent : C.line,
        strokeOpacity: lifted ? 0.6 : 0.16,
      });
      col.appendChild(c);
      c.x = 12;
      c.y = cardY;
      if (lifted) {
        c.effects = [{ type: 'DROP_SHADOW', color: rgba(C.accent, 0.35), offset: { x: 0, y: 12 }, radius: 30, spread: -12, visible: true, blendMode: 'NORMAL' }];
      }
      avatar(c, n.split(' ').map((w) => w[0]).join(''), 10, 10, 26);
      label(c, n, 44, 9, 11.5, 'Medium', C.ink);
      label(c, 'Terminale S · 2026', 44, 25, 9.5, 'Regular', C.faint);
      label(c, `REF-2026-0${42 + k}`, 10, 60, 8.5, 'Regular', C.faint);
      badge(c, 'Dossier', c.width - 62, 58, { fg: C.dim, bg: C.accent2, op: 0.14 });
    });
  });

  return s;
}

/* --- écran : fiche élève --- */
function screenFiche(dsPage) {
  const s = frame('11 · Fiche élève', W, H, solid(C.bg));
  dsPage.appendChild(s);
  sidebar(s, 'Fiche élève');
  topbar(s, 'Élèves', 'Fiche élève');

  label(s, 'Aminata Traoré', SIDEBAR + 22, 76, 26, 'Bold', C.ink, { letterSpacing: -0.5 });
  label(s, 'Terminale S · Matricule 2026-0142', SIDEBAR + 22, 112, 12, 'Regular', C.dim);

  const head = card(s, SIDEBAR + 22, 148, W - SIDEBAR - 44, 120);
  avatar(head, 'AT', 18, 26, 64);
  label(head, 'Aminata Traoré', 100, 28, 20, 'Bold', C.ink);
  label(head, 'Terminale S · Matricule 2026-0142', 100, 54, 10.5, 'Regular', C.faint);
  badge(head, 'Boursière', 100, 76, { fg: C.dim, bg: C.accent2, op: 0.14 });
  badge(head, 'Interne', 178, 76, { fg: C.dim, bg: C.accent2, op: 0.14 });
  badge(head, 'À jour', 244, 76, { fg: '#CDD8FF' });
  rect(head, head.width - 230, 44, 96, 32, { fill: solid(C.line, 0.08), radius: 8, stroke: C.line, strokeOpacity: 0.5 });
  label(head, 'Message', head.width - 212, 53, 11, 'Regular', C.ink);
  rect(head, head.width - 122, 44, 104, 32, { fill: grad(C.accent2, C.accent), radius: 8, stroke: C.white, strokeOpacity: 0.2 });
  label(head, 'Modifier', head.width - 104, 53, 11, 'Semi Bold', C.white);

  const colW = (W - SIDEBAR - 44 - 12) / 2;

  const info = card(s, SIDEBAR + 22, 286, colW, 236, { title: 'Informations', sub: 'Dossier scolaire' });
  [['Date de naissance', '12/03/2009'], ['Tuteur', 'Mme Traoré'], ['Téléphone', '+223 76 00 00 00'], ['Adresse', 'Hamdallaye ACI 2000'], ['E-mail', 'a.traore@famille.ml']].forEach(([k, v], i) => {
    const y = 60 + i * 32;
    rect(info, 16, y + 28, info.width - 32, 1, { fill: solid(C.line, 0.08) });
    label(info, k, 16, y, 11.5, 'Regular', C.faint);
    label(info, v, info.width - 32 - v.length * 6.2, y, 12, 'Regular', C.ink);
  });

  const docs = card(s, SIDEBAR + 22, 538, colW, 180, { title: 'Documents', sub: '3 fichiers' });
  [['Bulletin trimestre 1', 'PDF · 240 Ko'], ['Certificat de scolarité', 'PDF · 120 Ko'], ['Attestation de paiement', 'PDF · 96 Ko']].forEach(([n, m], i) => {
    const y = 58 + i * 40;
    rect(docs, 16, y + 34, docs.width - 32, 1, { fill: solid(C.line, 0.08) });
    rect(docs, 16, y, 26, 26, { fill: solid(C.accent, 0.16), radius: 7 });
    label(docs, n, 52, y + 3, 11.5, 'Medium', C.ink);
    label(docs, m, 52, y + 17, 9.5, 'Regular', C.faint);
    rect(docs, docs.width - 44, y + 4, 26, 22, { fill: solid(C.line, 0.08), radius: 6, stroke: C.line, strokeOpacity: 0.5 });
  });

  const att = card(s, SIDEBAR + 34 + colW, 286, colW, 150, { title: 'Assiduité', sub: '30 derniers jours' });
  badge(att, '96,8 %', att.width - 78, 15, { fg: '#CDD8FF' });
  rect(att, 16, 66, att.width - 32, 4, { fill: solid(C.line, 0.16), radius: 999 });
  rect(att, 16, 66, (att.width - 32) * 0.968, 4, { fill: grad(C.accent, C.accent2), radius: 999 });
  for (let i = 0; i < 30; i++) {
    const abs = i === 7 || i === 18 || i === 26;
    rect(att, 16 + i * 13.6, 92, 10, 26, { fill: solid(abs ? C.copper : C.accent, abs ? 0.85 : 0.55), radius: 2 });
  }

  const notes = card(s, SIDEBAR + 34 + colW, 452, colW, 266, { title: 'Notes du trimestre', sub: '5 matières' });
  label(notes, '12,8', notes.width - 74, 14, 19, 'Bold', C.accent2);
  label(notes, '/ 20', notes.width - 34, 20, 10, 'Regular', C.faint);
  [['Mathématiques', 15.5], ['Physique-Chimie', 13.0], ['Français', 16.0], ['Anglais', 14.5], ['Histoire-Géo', 12.5]].forEach(([k, v], i) => {
    const y = 62 + i * 38;
    label(notes, k, 16, y, 11.5, 'Regular', C.dim);
    rect(notes, 150, y + 5, notes.width - 210, 3, { fill: solid(C.line, 0.1), radius: 999 });
    rect(notes, 150, y + 5, (notes.width - 210) * (v / 20), 3, { fill: grad(C.accent, C.accent2), radius: 999 });
    label(notes, v.toFixed(1), notes.width - 42, y, 11, 'Medium', C.ink);
  });

  return s;
}

/* --- écran : modales (démonstration) --- */
function screenModals(dsPage) {
  const base = screenDashboard(dsPage);
  base.name = '14 · Modales';

  /* voile */
  const dim = frame('Voile', W, H, solid('#040612', 0.68));
  base.appendChild(dim);

  /* panneau */
  const mx = (W - 760) / 2;
  const my = 118;
  const m = frame('Modale · Nouvel élève', 760, 664, solid(C.panel, 0.33), {
    radius: 18, stroke: C.line, strokeOpacity: 0.28,
  });
  m.fills = [grad(C.panel, '#090D26', 0.96)];
  m.effects = [
    { type: 'DROP_SHADOW', color: rgba('#000000', 0.7), offset: { x: 0, y: 60 }, radius: 120, spread: -50, visible: true, blendMode: 'NORMAL' },
    { type: 'DROP_SHADOW', color: rgba(C.accent, 0.35), offset: { x: 0, y: 0 }, radius: 90, spread: -50, visible: true, blendMode: 'NORMAL' },
  ];
  base.appendChild(m);
  m.x = mx;
  m.y = my;

  rect(m, 20, 20, 38, 38, { fill: solid(C.accent, 0.18), radius: 11, stroke: C.accent, strokeOpacity: 0.4 });
  label(m, 'ADMISSIONS', 70, 20, 8.5, 'Medium', C.faint, { letterSpacing: 1.6 });
  label(m, 'Nouvel élève', 70, 34, 17, 'Bold', C.ink);
  label(m, 'Inscription · année scolaire 2025 — 2026', 70, 56, 11.5, 'Regular', C.dim);
  ellipse(m, m.width - 46, 22, 28, { stroke: C.line, fill: null });
  label(m, '×', m.width - 39, 26, 14, 'Regular', C.faint);
  rect(m, 0, 88, m.width, 1, { fill: solid(C.line, 0.16) });

  /* sections */
  [['Identité', 108], ['Scolarité', 300], ['Tuteur', 492]].forEach(([title, y]) => {
    rect(m, 20, y, m.width - 40, 176, { fill: solid(C.line, 0.035), radius: 12, stroke: C.line, strokeOpacity: 0.12 });
    label(m, title.toUpperCase(), 32, y + 14, 8.5, 'Medium', C.faint, { letterSpacing: 1.6 });
  });

  const field = (x, y, w, lab, val) => {
    label(m, lab, x, y, 10.5, 'Regular', C.faint);
    rect(m, x, y + 16, w, 34, { fill: solid(C.line, 0.06), radius: 9, stroke: C.line, strokeOpacity: 0.45 });
    label(m, val, x + 11, y + 26, 12, 'Regular', C.ink);
  };
  const cw2 = (m.width - 40 - 24 - 24) / 2;
  field(32, 136, cw2, 'Prénom', 'Aminata');
  field(32 + cw2 + 12, 136, cw2, 'Nom', 'Traoré');
  field(32, 210, cw2, 'Date de naissance', '12/03/2009');
  field(32 + cw2 + 12, 210, cw2, 'Sexe', 'Féminin');

  field(32, 328, cw2, 'Classe', 'Terminale S');
  field(32 + cw2 + 12, 328, cw2, 'Régime', 'Interne');
  field(32, 402, cw2, 'Matricule', '2026-0204');
  field(32 + cw2 + 12, 402, cw2, 'Statut', 'À jour');

  field(32, 520, cw2, 'Nom du tuteur', 'Mme Traoré');
  field(32 + cw2 + 12, 520, cw2, 'Téléphone', '+223 76 00 00 00');

  /* pied */
  const footY = m.height - 66;
  rect(m, 0, footY, m.width, 1, { fill: solid(C.line, 0.16) });
  label(m, 'ÉCHAP POUR ANNULER', 20, footY + 24, 8.5, 'Regular', C.faint, { letterSpacing: 1.2 });
  rect(m, m.width - 258, footY + 16, 110, 34, { fill: solid(C.line, 0.08), radius: 9, stroke: C.line, strokeOpacity: 0.5 });
  label(m, 'Annuler', m.width - 224, footY + 26, 11.5, 'Regular', C.ink);
  rect(m, m.width - 138, footY + 16, 118, 34, { fill: grad(C.accent2, C.accent), radius: 9, stroke: C.white, strokeOpacity: 0.2 });
  label(m, '+ Créer', m.width - 118, footY + 26, 11.5, 'Semi Bold', C.white);

  return base;
}

/* --- écran : matières --- */
function screenMatieres(dsPage) {
  const s = frame('04 · Matières', W, H, solid(C.bg));
  dsPage.appendChild(s);
  sidebar(s, 'Matières');
  topbar(s, 'Matières', 'Année 2025–2026');
  pageHead(s, 'Matières', '14 matières · 42 classes · 86 enseignants', 'Nouvelle matière', 'Exporter');

  const stats = [['14', 'Matières enseignées'], ['13,1', 'Moyenne générale'], ['312 h', 'Volume hebdomadaire'], ['4', 'Postes à pourvoir']];
  const sw = (W - SIDEBAR - 44 - 36) / 4;
  stats.forEach(([v, l], i) => {
    const c = card(s, SIDEBAR + 22 + i * (sw + 12), 148, sw, 74);
    label(c, v, 15, 14, 21, 'Bold', i === 1 ? C.accent2 : C.ink);
    label(c, l, 15, 45, 11, 'Regular', C.faint);
  });

  tableCard(s, SIDEBAR + 22, 240, W - SIDEBAR - 372, 638, 'Matières', 'Année 2025–2026 · triées par moyenne', [
    { initials: 'MA', name: 'Mathématiques', sub: 'Sciences · 6 enseignants', teachers: '6', classes: '12', avg: '13,40', pill: 'Tronc commun' },
    { initials: 'PH', name: 'Physique-Chimie', sub: 'Sciences · 5 enseignants', teachers: '5', classes: '10', avg: '12,10', pill: 'Tronc commun' },
    { initials: 'FR', name: 'Français', sub: 'Lettres · 7 enseignants', teachers: '7', classes: '14', avg: '14,20', pill: 'Tronc commun' },
    { initials: 'AN', name: 'Anglais', sub: 'Langues · 5 enseignants', teachers: '5', classes: '14', avg: '13,80', pill: 'Tronc commun' },
    { initials: 'HG', name: 'Histoire-Géo', sub: 'Sciences humaines · 4 enseignants', teachers: '4', classes: '11', avg: '11,90', pill: 'Tronc commun' },
    { initials: 'SV', name: 'SVT', sub: 'Sciences · 3 enseignants', teachers: '3', classes: '8', avg: '12,80', pill: 'Option' },
    { initials: 'PL', name: 'Philosophie', sub: 'Lettres · 3 enseignants', teachers: '3', classes: '6', avg: '11,40', pill: 'Option' },
    { initials: 'IN', name: 'Informatique', sub: 'Sciences · 2 enseignants', teachers: '2', classes: '8', avg: '15,20', pill: 'Option' },
  ], [
    { label: 'Matière', x: 16 },
    { label: 'Profs', x: 400, key: 'teachers' },
    { label: 'Classes', x: 500, key: 'classes' },
    { label: 'Moyenne', x: 610, key: 'avg' },
    { label: 'Statut', x: 716, kind: 'pill' },
  ]);

  const vol = card(s, W - 338, 240, 316, 638, { title: 'Volume horaire', sub: 'Heures / semaine · toutes classes' });
  const load = [['Mathématiques', 42], ['Français', 48], ['Physique-Chimie', 36], ['Anglais', 32], ['EPS', 28], ['Histoire-Géo', 28], ['SVT', 24], ['Informatique', 16]];
  load.forEach(([n, h], i) => {
    const y = 60 + i * 44;
    label(vol, n, 16, y, 11.5, 'Medium', C.ink);
    label(vol, h + ' h', vol.width - 58, y, 11, 'Medium', C.dim);
    rect(vol, 16, y + 20, vol.width - 32, 3, { fill: solid(C.line, 0.16), radius: 999 });
    rect(vol, 16, y + 20, (vol.width - 32) * (h / 48), 3, { fill: grad(C.accent, C.accent2), radius: 999 });
  });
  rect(vol, 16, 456, vol.width - 32, 1, { fill: solid(C.line, 0.16) });
  label(vol, 'TOTAL HEBDOMADAIRE', 16, 470, 8.5, 'Medium', C.faint, { letterSpacing: 1.4 });
  label(vol, '312 h', vol.width - 58, 466, 13, 'Bold', C.ink);
  rect(vol, 16, 500, vol.width - 32, 1, { fill: solid(C.line, 0.1) });
  label(vol, 'Moyenne toutes matières', 16, 514, 11, 'Regular', C.dim);
  label(vol, '13,10', vol.width - 62, 512, 12, 'Medium', C.accent2);

  return s;
}

/* --- écran : personnel --- */
function screenPersonnel(dsPage) {
  const s = frame('07 · Personnel', W, H, solid(C.bg));
  dsPage.appendChild(s);
  sidebar(s, 'Personnel');
  topbar(s, 'Personnel', 'Équipe pédagogique');
  pageHead(s, 'Personnel', '86 collaborateurs · 42 enseignants', 'Ajouter un membre', 'Exporter');

  kpiRow(s, [
    { label: 'Enseignants', value: '42', delta: '+3', hint: 'depuis la rentrée' },
    { label: 'Présence', value: '98,2 %', progress: 98.2, hint: 'cette semaine' },
    { label: 'Masse salariale', value: '31,4 M', unit: 'FCFA', hint: 'octobre 2026' },
    { label: 'Postes ouverts', value: '4', dot: true, hint: 'dont 2 en mathématiques' },
  ], 148);

  tableCard(s, SIDEBAR + 22, 270, W - SIDEBAR - 44, 420, 'Équipe', '86 collaborateurs · tri par ancienneté', [
    { initials: 'MD', name: 'Mariam Diallo', sub: 'Mathématiques · 2021', poste: 'Professeure', pill: 'Titulaire', charge: '18 h', classe: 'Terminale S' },
    { initials: 'OM', name: 'Oumar Martior', sub: 'Physique-Chimie · 2018', poste: 'Professeur', pill: 'Titulaire', charge: '16 h', classe: 'Première S' },
    { initials: 'TD', name: 'Tata Hilorma', sub: 'Français · 2022', poste: 'Professeure', pill: 'Contractuel', charge: '14 h', classe: 'Seconde A' },
    { initials: 'FR', name: 'Fatou Rifa', sub: 'Anglais · 2019', poste: 'Professeure', pill: 'Titulaire', charge: '17 h', classe: 'Terminale L' },
    { initials: 'SK', name: 'Seydou Keïta', sub: 'Histoire-Géo · 2024', poste: 'Professeur', pill: 'Stagiaire', charge: '9 h', classe: 'Seconde B' },
    { initials: 'AC', name: 'Aminata Cissé', sub: 'Vie scolaire · 2020', poste: 'C.P.E.', pill: 'Titulaire', charge: '35 h', classe: 'Toutes' },
  ], [
    { label: 'Membre', x: 16 },
    { label: 'Poste', x: 430, key: 'poste' },
    { label: 'Statut', x: 560, kind: 'pill' },
    { label: 'Charge', x: 690, key: 'charge' },
    { label: 'Classe principale', x: 810, key: 'classe' },
  ]);

  return s;
}

/* --- écran : messagerie --- */
function screenMessagerie(dsPage) {
  const s = frame('08 · Messagerie', W, H, solid(C.bg));
  dsPage.appendChild(s);
  sidebar(s, 'Messagerie');
  topbar(s, 'Messagerie', 'Boîte de réception');
  pageHead(s, 'Messagerie', '4 messages non lus · 12 conversations', 'Nouveau message', 'Tout marquer lu');

  const listW = 420;
  const list = card(s, SIDEBAR + 22, 148, listW, 730, { title: 'Conversations', sub: 'Récentes' });
  const threads = [
    ['MD', 'Mariam Diallo', 'Les notes du trimestre sont prêtes.', '09:42', true],
    ['OM', 'Oumar Martior', 'Peut-on décaler le cours de 14 h ?', '08:15', true],
    ['AT', 'Aminata Traoré', 'Merci pour le rendez-vous de lundi.', 'Hier', false],
    ['PD', 'Parent · M. Diallo', 'Justificatif d’absence en pièce jointe.', 'Hier', true],
    ['AD', 'Administration', 'Conseil de classe · 4 novembre.', 'Lun.', false],
    ['SK', 'Seydou Keïta', 'Emploi du temps de la semaine 45.', 'Lun.', false],
  ];
  threads.forEach((t, i) => {
    const y = 66 + i * 86;
    if (i === 0) {
      rect(list, 10, y - 10, list.width - 20, 78, { fill: solid(C.accent, 0.14), radius: 11 });
      rect(list, 10, y - 10, 2, 78, { fill: solid(C.accent2), radius: 2 });
    }
    avatar(list, t[0], 20, y, 30, i === 3);
    label(list, t[1], 60, y - 2, 12.5, i === 0 || t[4] ? 'Medium' : 'Regular', C.ink);
    label(list, t[2], 60, y + 16, 10.5, 'Regular', C.faint);
    label(list, t[3], list.width - 66, y, 9.5, 'Medium', C.faint);
    if (t[4]) ellipse(list, list.width - 26, y + 18, 7, { fill: solid(C.accent2) });
    if (i < threads.length - 1) rect(list, 20, y + 68, list.width - 40, 1, { fill: solid(C.line, 0.08) });
  });

  const conv = card(s, SIDEBAR + 22 + listW + 14, 148, W - SIDEBAR - 44 - listW - 14, 730);
  avatar(conv, 'MD', 20, 20, 38);
  label(conv, 'Mariam Diallo', 68, 20, 13.5, 'Semi Bold', C.ink);
  label(conv, 'Professeure · Mathématiques', 68, 38, 10.5, 'Regular', C.faint);
  badge(conv, 'En ligne', conv.width - 92, 28, { fg: '#BFF0DA', bg: C.success });
  rect(conv, 0, 76, conv.width, 1, { fill: solid(C.line, 0.16) });

  const bubbles = [
    ['received', 'Bonjour, les notes du trimestre sont saisies pour la Terminale S.', '09:38'],
    ['sent', 'Parfait. Pouvez-vous publier les bulletins avant vendredi ?', '09:40'],
    ['received', 'C’est prévu. Il reste deux conseils de classe à valider.', '09:42'],
    ['sent', 'Merci. Je préviens les familles dans la journée.', '09:44'],
  ];
  bubbles.forEach((b, i) => {
    const y = 100 + i * 78;
    const mine = b[0] === 'sent';
    const bw = Math.min(conv.width - 120, Math.max(240, b[1].length * 5.4));
    const x = mine ? conv.width - 20 - bw : 20;
    rect(conv, x, y, bw, 52, { fill: mine ? grad(C.accent, C.accent2, 0.9) : solid(C.line, 0.07), radius: 13, stroke: mine ? null : C.line, strokeOpacity: 0.18 });
    const t = label(conv, b[1], x + 14, y + 12, 11.5, 'Regular', mine ? C.white : C.ink);
    label(conv, b[2], x + 14, y + 30, 9, 'Regular', mine ? '#DCE4FF' : C.faint);
  });

  rect(conv, 0, conv.height - 84, conv.width, 1, { fill: solid(C.line, 0.16) });
  rect(conv, 20, conv.height - 64, conv.width - 150, 44, { fill: solid(C.line, 0.06), radius: 11, stroke: C.line, strokeOpacity: 0.3 });
  label(conv, 'Écrire un message…', 36, conv.height - 49, 11.5, 'Regular', C.faint);
  rect(conv, conv.width - 118, conv.height - 64, 98, 44, { fill: grad(C.accent2, C.accent), radius: 11, stroke: C.white, strokeOpacity: 0.2 });
  label(conv, 'Envoyer', conv.width - 94, conv.height - 49, 11.5, 'Semi Bold', C.white);

  return s;
}

/* --- écran : absences --- */
function screenAbsences(dsPage) {
  const s = frame('10 · Absences', W, H, solid(C.bg));
  dsPage.appendChild(s);
  sidebar(s, 'Absences');
  topbar(s, 'Absences', 'Semaine 44');
  pageHead(s, 'Absences', '96,8 % de présence · 41 absences cette semaine', 'Justifier une absence', 'Exporter');

  kpiRow(s, [
    { label: 'Absences', value: '41', delta: '−12 %', hint: 'vs semaine 43' },
    { label: 'Non justifiées', value: '9', dot: true, hint: 'à traiter aujourd’hui' },
    { label: 'Retards', value: '27', progress: 62, hint: '62 % du total' },
    { label: 'Justificatifs', value: '32', hint: 'reçus cette semaine' },
  ], 148);

  const chart = card(s, SIDEBAR + 22, 270, 520, 300, { title: 'Absences par jour', sub: 'Semaine 44 · lundi à vendredi' });
  const days = [['Lun', 9], ['Mar', 12], ['Mer', 7], ['Jeu', 8], ['Ven', 5]];
  const max = 12;
  days.forEach(([d, v], i) => {
    const bh = (v / max) * 160;
    rect(chart, 34 + i * 96, 76 + (160 - bh), 44, bh, { fill: grad(C.accent2, C.accent, 0.95), radius: 6 });
    label(chart, String(v), 34 + i * 96 + 16, 62 + (160 - bh), 10, 'Medium', C.ink);
    label(chart, d, 34 + i * 96 + 12, 250, 10, 'Regular', C.faint);
  });
  rect(chart, 22, 236, chart.width - 44, 1, { fill: solid(C.line, 0.2) });

  const todo = card(s, SIDEBAR + 556, 270, W - SIDEBAR - 578, 300, { title: 'À justifier', sub: '9 absences sans motif' });
  [['AT', 'Aminata Traoré', 'Mardi · 2 h'], ['MC', 'Moussa Camara', 'Mercredi · 1 h'], ['AS', 'Awa Sow', 'Jeudi · 3 h']].forEach(([ini, n, d], i) => {
    const y = 62 + i * 62;
    avatar(todo, ini, 16, y, 28);
    label(todo, n, 52, y + 2, 12, 'Medium', C.ink);
    label(todo, d, 52, y + 19, 10, 'Regular', C.faint);
    badge(todo, 'Justifier', todo.width - 92, y + 6, { fg: '#CDD8FF' });
    if (i < 2) rect(todo, 16, y + 50, todo.width - 32, 1, { fill: solid(C.line, 0.08) });
  });

  tableCard(s, SIDEBAR + 22, 590, W - SIDEBAR - 44, 288, 'Registre', 'Lundi 27 octobre', [
    { initials: 'IK', name: 'Ibrahim Konaté', sub: 'Terminale S · 2026-0143', statut: 'Non justifiée', duree: '2 h', periode: 'Matin' },
    { initials: 'FD', name: 'Fatoumata Diallo', sub: 'Première S · 2026-0151', statut: 'Justifiée', duree: '1 h', periode: 'Après-midi' },
    { initials: 'SK', name: 'Seydou Keïta', sub: 'Seconde B · 2026-0188', statut: 'Retard', duree: '15 min', periode: 'Matin' },
  ], [
    { label: 'Élève', x: 16 },
    { label: 'Motif', x: 430, kind: 'pill' },
    { label: 'Durée', x: 640, key: 'duree' },
    { label: 'Période', x: 790, key: 'periode' },
  ]);

  return s;
}

/* ---------------- orchestration ---------------- */
async function main(cmd) {
  if (typeof figma.loadAllPagesAsync === 'function') {
    await figma.loadAllPagesAsync();
  }

  await Promise.all([
    figma.loadFontAsync({ family: 'Inter', style: 'Regular' }),
    figma.loadFontAsync({ family: 'Inter', style: 'Medium' }),
    figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' }),
    figma.loadFontAsync({ family: 'Inter', style: 'Bold' }),
  ]);

  if (cmd === 'build-styles' || cmd === 'build-all') {
    const res = await buildStyles();
    figma.notify(`Styles créés · ${res.colors.length} couleurs · ${res.styles} typographies · ${res.effects} effets`);
  }

  if (cmd === 'build-all' || cmd === 'build-screens') {
    const dsPage = figma.currentPage;

    /* composants (crée une page dédiée, puis revient au design system) */
    try {
      buildComponents(dsPage);
      figma.currentPage = dsPage;
    } catch (e) {
      figma.currentPage = dsPage;
      figma.notify('Composants : ' + e.message, { error: true });
    }

    dsPage.name = '01 · Design system · DIALLO';
    const board = frame('Indigo Minuit · palette & échelle', 1240, 660, solid(C.bg));
    dsPage.appendChild(board);

    label(board, 'INDIGO MINUIT', 48, 40, 30, 'Bold', C.ink, { letterSpacing: -0.6 });
    label(board, 'DIALLO · ÉCOLE PREMIUM · DESKTOP ELECTRON · 1440 × 900', 48, 80, 9.5, 'Medium', C.faint, { letterSpacing: 1.8 });

    TOKENS.forEach(([name, hex], i) => {
      const x = 48 + (i % 6) * 190;
      const y = 130 + Math.floor(i / 6) * 148;
      rect(board, x, y, 170, 96, { fill: solid(hex), radius: 12, stroke: C.line, strokeOpacity: 0.3 });
      label(board, name.toUpperCase(), x, y + 108, 8.5, 'Medium', C.faint, { letterSpacing: 1.2 });
      label(board, hex, x, y + 122, 11, 'Medium', C.ink);
    });

    label(board, 'ÉCHELLE TYPOGRAPHIQUE', 48, 440, 9, 'Medium', C.faint, { letterSpacing: 1.6 });
    TYPE.forEach(([name, size, style, hex], i) => {
      const y = 466 + i * 22;
      label(board, name, 48, y + (14 - size / 2), 9, 'Regular', C.faint);
      const t = label(board, 'École Internationale Diallo', 300, y - Math.max(0, size - 14) / 2, size, style, hex);
      t.y = y + (14 - size / 2);
    });

    const SCREENS = [
      ['Tableau de bord', screenDashboard],
      ['Élèves', screenEleves],
      ['Classes', screenClasses],
      ['Matières', screenMatieres],
      ['Emploi du temps', screenTimetable],
      ['Finances', screenFinances],
      ['Personnel', screenPersonnel],
      ['Messagerie', screenMessagerie],
      ['Notes', screenNotes],
      ['Absences', screenAbsences],
      ['Fiche élève', screenFiche],
      ['Admissions', screenAdmissions],
      ['Paramètres', screenSettings],
      ['Modales', screenModals],
    ];

    const made = [];
    for (const [label, fn] of SCREENS) {
      try {
        made.push(fn(dsPage));
      } catch (e) {
        figma.notify(`${label} : ${e.message}`, { error: true });
      }
    }

    made.forEach((n, i) => {
      n.x = (i % 3) * (W + 80);
      n.y = 760 + Math.floor(i / 3) * (H + 80);
    });

    board.x = 0;
    board.y = 0;

    figma.notify(`Écrans générés · ${made.length}/${SCREENS.length}`);
  }

  figma.closePlugin();
}

const commands = {
  'build-all': () => main('build-all'),
  'build-styles': () => main('build-styles'),
  'build-screens': () => main('build-screens'),
};

(commands[figma.command] || commands['build-all'])().catch((e) => {
  figma.notify('Erreur : ' + e.message, { error: true });
  figma.closePlugin();
});
