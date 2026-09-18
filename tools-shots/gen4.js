/* Livrable final — Palette 01 Saphir & Ambre : PC (Electron) + Mobile (React Native) en pleine taille */
const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');
const { P, esc, chipW, I, deskMock, phoneMock } = require('./mockups');

const FONTS = path.join(__dirname, 'fonts-ttf');
const IMG = '/home/user/Arena/palettes-ophtalmo/img';
const resvgFontOpts = { fontDirs: [FONTS], loadSystemFonts: false, defaultFontFamily: 'Manrope' };

const p = P[1];

function sheet() {
  let s = `<defs>
  <radialGradient id="gl1" cx="0.2" cy="0.05" r="0.85"><stop offset="0" stop-color="${p.ga}" stop-opacity="0.22"/><stop offset="1" stop-color="${p.ga}" stop-opacity="0"/></radialGradient>
  <radialGradient id="gl2" cx="0.85" cy="0.15" r="0.7"><stop offset="0" stop-color="${p.acc}" stop-opacity="0.10"/><stop offset="1" stop-color="${p.acc}" stop-opacity="0"/></radialGradient>
  <linearGradient id="gr" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${p.ga}"/><stop offset="1" stop-color="${p.gb}"/></linearGradient>
  <filter id="shd" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="22" stdDeviation="34" flood-color="#000000" flood-opacity="0.55"/></filter>
</defs>`;
  /* fond */
  s += `<image href="${IMG}/bg-texture-sombre.jpg" x="0" y="0" width="1440" height="1360" preserveAspectRatio="xMidYMid slice"/>`;
  s += `<rect width="1440" height="1360" fill="rgba(8,9,14,0.88)"/>`;
  s += `<rect width="1440" height="1360" fill="url(#gl1)"/><rect width="1440" height="1360" fill="url(#gl2)"/>`;

  /* header */
  s += `<text x="80" y="80" font-family="Manrope" font-weight="800" font-size="12" fill="#9AA1B8" letter-spacing="3">OCULIS · PALETTE SÉLECTIONNÉE — GESTION DE CLINIQUE OPHTALMO</text>`;
  s += `<text x="76" y="168" font-family="Fraunces" font-weight="600" font-size="58" fill="#F4F5FB">01 — Saphir &amp; <tspan font-style="italic" font-weight="300">Ambre</tspan></text>`;
  s += `<text x="80" y="208" font-family="Manrope" font-weight="600" font-size="14" fill="#8F96B0">Gestion de clinique ophtalmo · réception, pilotage &amp; facturation · photo de la clinique en fond</text>`;
  s += `<rect x="988" y="56" width="372" height="66" rx="14" fill="rgba(255,255,255,0.045)" stroke="rgba(255,255,255,0.13)"/>`;
  s += I('electron', 1008, 76, 28, '#8FB3FF', 1.6);
  s += I('rn', 1046, 76, 28, '#37A37F', 1.6);
  s += `<text x="1090" y="86" font-family="Manrope" font-weight="800" font-size="15" fill="#F4F5FB" letter-spacing="1">PC ELECTRON + MOBILE RN</text>`;
  s += `<text x="1090" y="105" font-family="Manrope" font-weight="600" font-size="10.5" fill="#8F96B0">Palette 01 · design system final</text>`;

  /* mockup desktop ×1 */
  s += `<g filter="url(#shd)"><rect x="70" y="240" width="880" height="720" rx="17" fill="#10131B"/></g>`;
  s += `<g transform="translate(70 240)">${deskMock(p, 1)}</g>`;
  /* mockup mobile ×1 */
  s += `<g transform="translate(990 240)"><g filter="url(#shd)"><rect x="0" y="0" width="380" height="860" rx="52" fill="#151823"/></g>${phoneMock(p, 'f1')}</g>`;

  /* légendes */
  s += I('desktop', 70, 982, 15, '#9AA1B8', 1.8);
  s += `<text x="94" y="994.5" font-family="Manrope" font-weight="800" font-size="11" fill="#9AA1B8" letter-spacing="1.6">PC · ELECTRON</text>`;
  s += I('mobile', 990, 1122, 15, '#9AA1B8', 1.8);
  s += `<text x="1014" y="1134.5" font-family="Manrope" font-weight="800" font-size="11" fill="#9AA1B8" letter-spacing="1.6">MOBILE · REACT NATIVE</text>`;

  /* sous le desktop : mood, dégradé, usage, specs */
  let cx = 70;
  p.mood.forEach(m => {
    const w = chipW(m.toUpperCase(), 10);
    s += `<rect x="${cx}" y="1022" width="${w}" height="28" rx="14" fill="none" stroke="rgba(255,255,255,0.16)"/>`;
    s += `<text x="${cx + w / 2}" y="1040" font-family="Manrope" font-weight="800" font-size="10" fill="#B9C0D8" text-anchor="middle" letter-spacing="1.4">${m.toUpperCase()}</text>`;
    cx += w + 10;
  });
  s += `<rect x="70" y="1070" width="880" height="40" rx="11" fill="url(#gr)"/>`;
  s += `<text x="86" y="1095" font-family="JetBrains Mono" font-size="12" fill="#FFFFFF" font-weight="700">linear-gradient(135deg, ${p.ga}, ${p.gb})</text>`;
  s += `<text x="70" y="1146" font-family="Manrope" font-weight="600" font-size="12.5" fill="#B9C0D8">${esc(p.use)}</text>`;
  p.specs.forEach((sp, i) => {
    const x = 70 + i * 296;
    s += `<rect x="${x}" y="1164" width="284" height="32" rx="9" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)"/>`;
    s += `<text x="${x + 142}" y="1184" font-family="JetBrains Mono" font-size="10" fill="#B9C0D8" text-anchor="middle">${sp}</text>`;
  });

  /* colonne mobile : rappel écran */
  s += `<text x="990" y="1176" font-family="Manrope" font-weight="800" font-size="10.5" fill="#9AA1B8" letter-spacing="1.4">ÉCRAN « RÉCEPTION »</text>`;
  s += `<text x="990" y="1196" font-family="Manrope" font-weight="600" font-size="11" fill="#B9C0D8">Salle d'attente · agenda · check-in · rappels</text>`;

  /* tokens plein largeur */
  const tk = [
    ['Fond', p.bg], ['Surface', p.surface], ['Texte 1', p.t1], ['Primaire', p.pri],
    [p.accentName, p.acc], ['Succès', p.ok], ['Alerte', p.warn], ['Erreur', p.err],
  ];
  tk.forEach((t, i) => {
    const x = 13 + i * 178, y = 1226;
    s += `<rect x="${x}" y="${y}" width="168" height="56" rx="11" fill="rgba(255,255,255,0.035)" stroke="rgba(255,255,255,0.08)"/>`;
    s += `<rect x="${x + 12}" y="${y + 12}" width="32" height="32" rx="8" fill="${t[1]}" stroke="rgba(255,255,255,0.12)"/>`;
    s += `<text x="${x + 54}" y="${y + 27}" font-family="Manrope" font-weight="700" font-size="11" fill="#E9EBF4">${esc(t[0])}</text>`;
    s += `<text x="${x + 54}" y="${y + 43}" font-family="JetBrains Mono" font-size="10" fill="#8F96B0">${t[1]}</text>`;
  });

  /* footer */
  s += `<text x="80" y="1330" font-family="Manrope" font-weight="800" font-size="10.5" fill="#6E7690" letter-spacing="2">OCULIS · SAPHIR &amp; AMBRE — PALETTE RETENUE</text>`;
  s += `<text x="720" y="1330" font-family="Manrope" font-weight="700" font-size="10.5" fill="#6E7690" text-anchor="middle" letter-spacing="1.5">CONTRASTE AA · FOND : RECEPTION CLINIQUE</text>`;
  s += `<text x="1360" y="1330" font-family="JetBrains Mono" font-size="10.5" fill="#6E7690" text-anchor="end">electron/oculis.theme.css · react-native/oculis.theme.js</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="1360" viewBox="0 0 1440 1360">${s}</svg>`;
}

const OUT = '/home/user/Arena/palettes-ophtalmo/png';
const svg = sheet();
fs.writeFileSync(path.join(OUT, '01-saphir-ambre-pc-mobile-final.svg'), svg);
const r = new Resvg(svg, { font: resvgFontOpts, fitTo: { mode: 'width', value: 1440 } });
const png = r.render().asPng();
fs.writeFileSync(path.join(OUT, '01-saphir-ambre-pc-mobile-final.png'), png);
console.log('OK 01-saphir-ambre-pc-mobile-final.png', (png.length / 1024).toFixed(0) + ' Ko');
