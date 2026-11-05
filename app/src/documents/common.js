/* ============================================================
   Kalanso — mise en page commune des documents imprimables
   (en-tête de l'école, typographie, styles @page A4)
   ============================================================ */

export const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

export const formatDateFr = (value, { long = true } = {}) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return escapeHtml(String(value));
  return date.toLocaleDateString('fr-FR', long
    ? { day: 'numeric', month: 'long', year: 'numeric' }
    : { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const formatAmount = (value) => new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 0,
}).format(Math.round(Number(value) || 0));

export const round2 = (value) => Math.round(Number(value) * 100) / 100;

/* Styles communs : A4, en-tête d'école, caractères sûrs pour l'impression. */
export const PRINT_CSS = `
/* Taille A4 ; les marges sont gérées par Electron (printToPDF, margins custom).
   Sur les moteurs qui honorent @page, elles s'appliquent aussi côté CSS. */
@page { size: A4; margin: 11mm 13mm 13mm 13mm; }
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  color: #141a33;
  font-size: 9pt;
  line-height: 1.28;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.lh { display: flex; align-items: center; justify-content: space-between; gap: 12mm; }
.lh-kicker {
  display: block; font-size: 6.6pt; font-weight: 700; letter-spacing: .22em;
  text-transform: uppercase; color: #8a6a34; margin-bottom: 1.2mm;
}
.lh h1 {
  margin: 0 0 .8mm; font-family: Georgia, 'Times New Roman', serif;
  font-size: 21pt; font-weight: 700; color: #10163a; letter-spacing: .02em;
}
.lh-full { margin: 0; font-size: 8.6pt; color: #3d4568; }
.lh-contact { margin: 1.4mm 0 0; font-size: 7.2pt; color: #6b7295; }
.lh-logo img { max-height: 17mm; max-width: 26mm; object-fit: contain; }
.lh-mark {
  width: 16mm; height: 16mm; border-radius: 1.6mm;
  background: #10163a; color: #e8ecff;
  display: flex; align-items: center; justify-content: center;
  font-family: Georgia, serif; font-size: 25pt;
  border-bottom: 3.2mm solid #b8863b;
}
.lh-rule {
  height: 1.2mm; margin: 3mm 0 4mm;
  border-top: 2pt solid #10163a; border-bottom: .55pt solid #b8863b;
}
.doc-title { text-align: center; margin: 2mm 0 4mm; }
.doc-title h2 {
  margin: 0; font-family: Georgia, serif; font-size: 15pt; font-weight: 700;
  letter-spacing: .3em; text-transform: uppercase; color: #10163a;
}
.doc-title p { margin: 1mm 0 0; font-size: 8.5pt; color: #4a5178; }
.meta-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 0 8mm;
  border: .6pt solid #dfe4f2; border-radius: 1.5mm;
  padding: 2.8mm 5mm; margin-bottom: 4mm;
}
.meta-row {
  display: flex; align-items: baseline; gap: 3mm;
  padding: 1.15mm 0; border-bottom: .4pt dotted #dfe4f2;
}
.meta-row:nth-last-child(-n+2) { border-bottom: none; }
.meta-row dt { min-width: 30mm; font-size: 6.6pt; letter-spacing: .12em; text-transform: uppercase; color: #6b7295; }
.meta-row dd { margin: 0; font-size: 9pt; color: #141a33; font-weight: 600; }
table.doc {
  width: 100%; border-collapse: collapse; font-size: 8pt;
  font-variant-numeric: tabular-nums; margin-bottom: 4mm;
}
table.doc thead th {
  background: #10163a; color: #f4f6ff; font-size: 6.4pt; font-weight: 700;
  letter-spacing: .14em; text-transform: uppercase; text-align: left;
  padding: 2.4mm 2.4mm;
}
table.doc tbody td {
  border-bottom: .5pt solid #dfe4f2; padding: 1.5mm 2.4mm;
  border-left: .4pt solid #eef0f8;
}
table.doc tbody td:first-child { border-left: none; }
table.doc tbody tr:nth-child(even) td { background: #f7f8fd; }
table.doc tfoot td {
  padding: 2.4mm; background: #eef0f8; border-top: 1.4pt solid #10163a;
  font-weight: 700; color: #10163a;
}
.num { text-align: right; font-variant-numeric: tabular-nums; }
.mention { font-weight: 700; }
.appreciation {
  border: .6pt solid #dfe4f2; border-radius: 1.5mm;
  padding: 2.5mm 4mm; margin-bottom: 4mm;
}
.appreciation .label, .cert .label {
  font-size: 6.4pt; font-weight: 700; letter-spacing: .14em;
  text-transform: uppercase; color: #8a6a34;
}
.appreciation .lines {
  margin-top: 2mm; height: 12mm;
  background: repeating-linear-gradient(to bottom, transparent 0 6mm, #dfe4f2 6mm calc(6mm + .5pt));
}
.sig { display: flex; gap: 12mm; margin-top: 5mm; }
.sig > div {
  flex: 1; height: 15mm; border-top: .6pt solid #10163a;
  padding-top: 1.8mm; text-align: center;
  font-size: 8pt; color: #3d4568; font-weight: 600;
}
.sig small {
  display: block; margin-top: 1mm;
  font-size: 6pt; color: #8a8fb0; font-weight: 400;
  letter-spacing: .1em; text-transform: uppercase;
}
.foot {
  margin-top: 6mm; border-top: .5pt solid #dfe4f2; padding-top: 3mm;
  font-size: 6.4pt; color: #8a8fb0; text-align: center;
}
.foot p { margin: .8mm 0; }
`;

/** En-tête de l'école : nom, coordonnées, cachet. */
export function letterhead(meta) {
  const school = meta?.school || {};
  const photo = school.photo_url;
  const contact = [school.address, school.phone, school.email]
    .filter(Boolean)
    .map(escapeHtml)
    .join(' · ');

  return `<header class="lh">
    <div class="lh-text">
      <span class="lh-kicker">Établissement d'enseignement</span>
      <h1>${escapeHtml(school.name || 'Kalanso')}</h1>
      ${school.full_name ? `<p class="lh-full">${escapeHtml(school.full_name)}</p>` : ''}
      ${contact ? `<p class="lh-contact">${contact}</p>` : ''}
    </div>
    <div class="lh-logo">
      ${photo
        ? `<img src="${escapeHtml(photo)}" alt="" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'lh-mark',textContent:'K'}))" />`
        : '<div class="lh-mark">K</div>'}
    </div>
  </header>
  <div class="lh-rule"></div>`;
}

/** Pied de page discret du document. */
export function pageFooter(lines) {
  return `<footer class="foot">${lines.map((line) => `<p>${escapeHtml(line)}</p>`).join('')}</footer>`;
}
