/* Image unifiée v3 : 3 palettes en une — PC (Electron) + MOBILE (React Native) en taille pleine */
const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');
const { P, esc, chipW, I, deskMock, phoneMock } = require('./mockups');

const FONTS = path.join(__dirname, 'fonts-ttf');
const IMG = '/home/user/Arena/palettes-ophtalmo/img';
const resvgFontOpts = { fontDirs: [FONTS], loadSystemFonts: false, defaultFontFamily: 'Manrope' };

/* Canvas 3180×1380 — colonnes de 980, desktop ×0.8 (704×576) + phone ×0.66 (251×568) */
function sheet() {
  let s = `<defs>
  <radialGradient id="gl1" cx="0.15" cy="0.08" r="0.7"><stop offset="0" stop-color="${P[1].ga}" stop-opacity="0.14"/><stop offset="1" stop-color="${P[1].ga}" stop-opacity="0"/></radialGradient>
  <radialGradient id="gl2" cx="0.5" cy="0.05" r="0.7"><stop offset="0" stop-color="${P[2].ga}" stop-opacity="0.12"/><stop offset="1" stop-color="${P[2].ga}" stop-opacity="0"/></radialGradient>
  <radialGradient id="gl3" cx="0.86" cy="0.1" r="0.7"><stop offset="0" stop-color="${P[3].ga}" stop-opacity="0.15"/><stop offset="1" stop-color="${P[3].ga}" stop-opacity="0"/></radialGradient>
  <linearGradient id="gr1" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${P[1].ga}"/><stop offset="1" stop-color="${P[1].gb}"/></linearGradient>
  <linearGradient id="gr2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${P[2].ga}"/><stop offset="1" stop-color="${P[2].gb}"/></linearGradient>
  <linearGradient id="gr3" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${P[3].ga}"/><stop offset="1" stop-color="${P[3].gb}"/></linearGradient>
  <filter id="shd" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="22" stdDeviation="34" flood-color="#000000" flood-opacity="0.55"/></filter>
</defs>`;
  /* fond */
  s += `<image href="${IMG}/bg-texture-sombre.jpg" x="0" y="0" width="3180" height="1380" preserveAspectRatio="xMidYMid slice"/>`;
  s += `<rect width="3180" height="1380" fill="rgba(8,9,14,0.88)"/>`;
  s += `<rect width="3180" height="1380" fill="url(#gl1)"/><rect width="3180" height="1380" fill="url(#gl2)"/><rect width="3180" height="1380" fill="url(#gl3)"/>`;
  /* header */
  s += `<text x="80" y="88" font-family="Manrope" font-weight="800" font-size="12" fill="#9AA1B8" letter-spacing="3">OCULIS · GESTION DE CLINIQUE OPHTALMO — RÉCEPTION, PILOTAGE &amp; FACTURATION</text>`;
  s += `<text x="76" y="192" font-family="Fraunces" font-weight="600" font-size="68" fill="#F4F5FB">Les 3 palettes <tspan font-style="italic" font-weight="300">en un</tspan></text>`;
  s += `<text x="80" y="236" font-family="Manrope" font-weight="600" font-size="14.5" fill="#8F96B0">Gestion de clinique ophtalmo — PC (Electron) + Mobile (React Native) · photos de la clinique en fond</text>`;
  s += `<rect x="2728" y="66" width="372" height="66" rx="14" fill="rgba(255,255,255,0.045)" stroke="rgba(255,255,255,0.13)"/>`;
  s += I('electron', 2748, 86, 28, '#8FB3FF', 1.6);
  s += I('rn', 2786, 86, 28, '#37A37F', 1.6);
  s += `<text x="2830" y="96" font-family="Manrope" font-weight="800" font-size="15" fill="#F4F5FB" letter-spacing="1">PC ELECTRON + MOBILE RN</text>`;
  s += `<text x="2830" y="115" font-family="Manrope" font-weight="600" font-size="10.5" fill="#8F96B0">3 palettes · 1 design system · v3</text>`;

  [1, 2, 3].forEach(k => {
    const p = P[k], x0 = 60 + (k - 1) * 1020;
    /* mockup desktop ×0.8 */
    s += `<g filter="url(#shd)"><rect x="${x0}" y="290" width="704" height="576" rx="13" fill="#10131B"/></g>`;
    s += `<g transform="translate(${x0} 290) scale(0.8)">${deskMock(p, k)}</g>`;
    /* mockup mobile ×0.66 */
    s += `<g transform="translate(${x0 + 728} 290) scale(0.66)"><g filter="url(#shd)"><rect x="0" y="0" width="380" height="860" rx="52" fill="#151823"/></g>${phoneMock(p, 'u' + k)}</g>`;
    /* légendes */
    s += I('desktop', x0, 890, 15, '#9AA1B8', 1.8);
    s += `<text x="${x0 + 24}" y="902.5" font-family="Manrope" font-weight="800" font-size="10.5" fill="#9AA1B8" letter-spacing="1.6">PC · ELECTRON</text>`;
    s += I('mobile', x0 + 728, 890, 15, '#9AA1B8', 1.8);
    s += `<text x="${x0 + 752}" y="902.5" font-family="Manrope" font-weight="800" font-size="10.5" fill="#9AA1B8" letter-spacing="1.6">MOBILE · REACT NATIVE</text>`;
    /* nom + mood */
    s += `<text x="${x0}" y="968" font-family="Fraunces" font-weight="600" font-size="40" fill="#F4F5FB">${p.num} — ${esc(p.nameA)} <tspan font-style="italic" font-weight="300">${esc(p.nameB)}</tspan></text>`;
    let cx = x0;
    p.mood.forEach(m => {
      const w = chipW(m.toUpperCase(), 9.5);
      s += `<rect x="${cx}" y="988" width="${w}" height="26" rx="13" fill="none" stroke="rgba(255,255,255,0.16)"/>`;
      s += `<text x="${cx + w / 2}" y="1005" font-family="Manrope" font-weight="800" font-size="9.5" fill="#B9C0D8" text-anchor="middle" letter-spacing="1.4">${m.toUpperCase()}</text>`;
      cx += w + 10;
    });
    /* dégradé */
    s += `<rect x="${x0}" y="1034" width="980" height="38" rx="10" fill="url(#gr${k})"/>`;
    s += `<text x="${x0 + 14}" y="1058" font-family="JetBrains Mono" font-size="11" fill="#FFFFFF" font-weight="700">linear-gradient(135deg, ${p.ga}, ${p.gb})</text>`;
    /* tokens 4×2 */
    const tk = [
      ['Fond', p.bg], ['Surface', p.surface], ['Texte 1', p.t1], ['Primaire', p.pri],
      [p.accentName, p.acc], ['Succès', p.ok], ['Alerte', p.warn], ['Erreur', p.err],
    ];
    tk.forEach((t, i) => {
      const x = x0 + (i % 4) * 249, y = 1090 + Math.floor(i / 4) * 62;
      s += `<rect x="${x}" y="${y}" width="233" height="54" rx="11" fill="rgba(255,255,255,0.035)" stroke="rgba(255,255,255,0.08)"/>`;
      s += `<rect x="${x + 12}" y="${y + 11}" width="32" height="32" rx="8" fill="${t[1]}" stroke="rgba(255,255,255,0.12)"/>`;
      s += `<text x="${x + 58}" y="${y + 25}" font-family="Manrope" font-weight="700" font-size="11" fill="#E9EBF4">${esc(t[0])}</text>`;
      s += `<text x="${x + 58}" y="${y + 41}" font-family="JetBrains Mono" font-size="10" fill="#8F96B0">${t[1]}</text>`;
    });
    /* usage + specs */
    s += `<text x="${x0}" y="1252" font-family="Manrope" font-weight="600" font-size="12" fill="#B9C0D8">${esc(p.use)}</text>`;
    p.specs.forEach((sp, i) => {
      const x = x0 + i * 328;
      s += `<rect x="${x}" y="1272" width="312" height="30" rx="9" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)"/>`;
      s += `<text x="${x + 156}" y="1291" font-family="JetBrains Mono" font-size="9.5" fill="#B9C0D8" text-anchor="middle">${sp}</text>`;
    });
  });

  /* footer */
  s += `<text x="80" y="1352" font-family="Manrope" font-weight="800" font-size="10.5" fill="#6E7690" letter-spacing="2">OCULIS · 3 PALETTES EN UN — GESTION DE CLINIQUE OPHTALMO</text>`;
  s += `<text x="1590" y="1352" font-family="Manrope" font-weight="700" font-size="10.5" fill="#6E7690" text-anchor="middle" letter-spacing="1.5">CONTRASTE AA · FOND : RECEPTION CLINIQUE, SALLE D’ATTENTE, IRIS, IMAGERIE</text>`;
  s += `<text x="3100" y="1352" font-family="JetBrains Mono" font-size="10.5" fill="#6E7690" text-anchor="end">export : index.html · electron/ + react-native/</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="3180" height="1380" viewBox="0 0 3180 1380">${s}</svg>`;
}

const OUT = '/home/user/Arena/palettes-ophtalmo/png';
const svg = sheet();
fs.writeFileSync(path.join(OUT, '00-3-palettes-en-1-clinique.svg'), svg);
const r = new Resvg(svg, { font: resvgFontOpts, fitTo: { mode: 'width', value: 3180 } });
const png = r.render().asPng();
fs.writeFileSync(path.join(OUT, '00-3-palettes-en-1-clinique.png'), png);
console.log('OK 00-3-palettes-en-1-clinique.png (v3, mobile pleine taille)', (png.length / 1024).toFixed(0) + ' Ko');
