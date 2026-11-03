import {
  compactMoney, date, money, number, INVOICE_STATUS, PAYMENT_METHODS, PAYMENT_STATUS,
} from './data.jsx';

/* ============================================================
   Kalanso — rapports imprimables
   Le tableau de bord s'exporte en PDF via la boîte d'impression
   du navigateur, avec ses indicateurs et ses graphiques.
   ============================================================ */

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const generatedAt = () => new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'long',
  timeStyle: 'short',
}).format(new Date());

/* Ouvre le rapport dans un cadre isolé puis la boîte d'impression du navigateur. */
const printHtml = (html) => {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.cssText = 'position:fixed;left:-10000px;top:0;width:1024px;height:1400px;border:0;';
  document.body.appendChild(frame);

  const frameDocument = frame.contentWindow?.document;
  if (!frameDocument) {
    frame.remove();
    return;
  }

  const cleanup = () => window.setTimeout(() => frame.remove(), 600);
  frameDocument.open();
  frameDocument.write(html);
  frameDocument.close();
  frame.contentWindow.addEventListener('afterprint', cleanup, { once: true });

  window.setTimeout(() => {
    try {
      frame.contentWindow.focus();
      frame.contentWindow.print();
    } catch {
      cleanup();
    }
  }, 450);
};

const monthlyChart = (series, currency) => {
  const rows = series.map((row) => ({
    label: row.label || '',
    value: Number(row.total || 0) / 1_000_000,
  }));

  if (!rows.length) {
    return '<div class="empty">Aucun encaissement enregistré pour cette période.</div>';
  }

  const width = 720;
  const height = 238;
  const pad = { top: 18, right: 14, bottom: 34, left: 46 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const max = Math.max(...rows.map((row) => row.value), 1) * 1.12;
  const stepX = rows.length > 1 ? plotW / (rows.length - 1) : 0;
  const x = (index) => pad.left + index * stepX;
  const y = (value) => pad.top + plotH - (value / max) * plotH;
  const points = rows.map((row, index) => [x(index), y(row.value)]);
  const line = points
    .map(([px, py], index) => `${index ? 'L' : 'M'}${px.toFixed(1)} ${py.toFixed(1)}`)
    .join(' ');
  const area = `${line} L${x(rows.length - 1).toFixed(1)} ${(pad.top + plotH).toFixed(1)} L${pad.left} ${(pad.top + plotH).toFixed(1)} Z`;
  const grid = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
    const gy = pad.top + plotH - ratio * plotH;
    const value = max * ratio;
    return `
      <line x1="${pad.left}" x2="${width - pad.right}" y1="${gy}" y2="${gy}" stroke="#E4E8F5" stroke-width="1"/>
      <text x="${pad.left - 8}" y="${gy + 3}" text-anchor="end" class="axis">${value ? number(value, value < 1 ? 1 : 0) : '0'}</text>
    `;
  }).join('');
  const labels = rows.map((row, index) => {
    if (rows.length > 8 && index % 2 !== 0 && index !== rows.length - 1) return '';
    return `<text x="${x(index)}" y="${height - 12}" text-anchor="middle" class="axis">${escapeHtml(row.label)}</text>`;
  }).join('');
  const dots = points.map(([px, py], index) => `
    <circle cx="${px}" cy="${py}" r="3.2" fill="#FFFFFF" stroke="#5B7CFA" stroke-width="2">
      <title>${escapeHtml(rows[index].label)} : ${number(rows[index].value, 2)} M ${escapeHtml(currency)}</title>
    </circle>
  `).join('');

  return `
    <svg class="chart-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Recouvrement mensuel">
      <defs>
        <linearGradient id="reportArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#5B7CFA" stop-opacity=".38"/>
          <stop offset="100%" stop-color="#5B7CFA" stop-opacity=".03"/>
        </linearGradient>
        <linearGradient id="reportLine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#7E9BFF"/>
          <stop offset="100%" stop-color="#5B7CFA"/>
        </linearGradient>
      </defs>
      ${grid}
      ${labels}
      <path d="${area}" fill="url(#reportArea)"/>
      <path d="${line}" fill="none" stroke="url(#reportLine)" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
      ${dots}
      <text x="${pad.left}" y="12" class="axis axis-title">millions de ${escapeHtml(currency)}</text>
    </svg>
  `;
};

const classBars = (distribution) => {
  if (!distribution.length) {
    return '<div class="empty">Aucune classe enregistrée.</div>';
  }

  const max = Math.max(...distribution.map((row) => Number(row.value || 0)), 1);
  return `
    <div class="bars">
      ${distribution.map((row) => {
    const value = Number(row.value || 0);
    const width = Math.max(2, (value / max) * 100);
    return `
          <div class="bar-row">
            <span class="bar-label">${escapeHtml(row.label)}</span>
            <span class="bar-track"><i style="width:${width}%"></i></span>
            <b class="bar-value">${number(value)}</b>
          </div>
        `;
  }).join('')}
    </div>
  `;
};

const attendanceDonut = (attendance) => {
  const percentage = Math.max(0, Math.min(100, Number(attendance || 0)));
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const dash = (percentage / 100) * circumference;

  return `
    <svg class="donut-svg" viewBox="0 0 120 120" role="img" aria-label="Taux de présence ${number(percentage, 1)} %">
      <circle cx="60" cy="60" r="${radius}" fill="none" stroke="#E4E8F5" stroke-width="12"/>
      <circle cx="60" cy="60" r="${radius}" fill="none" stroke="#5B7CFA" stroke-width="12"
        stroke-dasharray="${dash.toFixed(2)} ${(circumference - dash).toFixed(2)}"
        stroke-linecap="round" transform="rotate(-90 60 60)"/>
      <text x="60" y="57" text-anchor="middle" class="donut-value">${number(percentage, 1)} %</text>
      <text x="60" y="74" text-anchor="middle" class="donut-label">présence</text>
    </svg>
  `;
};

export function exportDashboardReport({
  meta, data, currency = 'FCFA',
}) {
  const kpis = data?.kpis || {};
  const school = meta?.school || {};
  const distribution = data?.class_distribution || [];
  const series = data?.recovery_series || [];
  const today = data?.today || [];
  const classCount = Number(kpis.classes ?? meta?.counts?.classes ?? distribution.length ?? 0);
  const studentCount = Number(kpis.students ?? meta?.counts?.students ?? 0);
  const recovery = Number(kpis.recovery || 0);
  const attendance = Number(kpis.attendance || 0);
  const reportDate = generatedAt();

  const kpiCards = [
    { label: 'Élèves inscrits', value: number(studentCount), hint: `${number(classCount)} classes` },
    { label: 'Taux de présence', value: `${number(attendance, 1)} %`, hint: 'moyenne du mois' },
    { label: 'Recouvrement', value: compactMoney(recovery, currency), hint: 'encaissements de l’année' },
    { label: 'Cours aujourd’hui', value: number(today.length), hint: 'créneaux programmés' },
  ];

  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Kalanso — Tableau de bord</title>
<style>
  :root {
    --ink: #141a36;
    --muted: #667092;
    --line: #e4e8f5;
    --accent: #5b7cfa;
    --accent-soft: #eef1ff;
    --copper: #c9924f;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: Inter, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: var(--ink);
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page { width: 190mm; margin: 0 auto; padding: 8mm 0; }
  .hero {
    display: flex; align-items: center; justify-content: space-between; gap: 22px;
    padding: 18px 20px; border-radius: 16px; color: #fff;
    background: linear-gradient(135deg, #070b1f 0%, #172153 58%, #293b86 100%);
  }
  .hero-brand { display: flex; align-items: center; gap: 13px; min-width: 0; }
  .hero-mark {
    width: 42px; height: 42px; flex: none; display: grid; place-items: center;
    border-radius: 12px; background: linear-gradient(145deg, #7e9bff, #5b7cfa);
    font-weight: 800; font-size: 18px; letter-spacing: .03em;
  }
  .hero h1 { margin: 0; font-size: 21px; letter-spacing: .01em; }
  .hero p { margin: 4px 0 0; font-size: 11px; color: rgba(255,255,255,.68); }
  .hero-meta { text-align: right; font-size: 10.5px; line-height: 1.55; color: rgba(255,255,255,.72); }
  .hero-meta b { display: block; color: #fff; font-size: 12px; }
  .eyebrow {
    margin: 17px 0 7px; font-size: 9px; font-weight: 700; letter-spacing: .18em;
    text-transform: uppercase; color: var(--muted);
  }
  .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 9px; }
  .kpi {
    padding: 12px 13px; border: 1px solid var(--line); border-radius: 12px;
    background: linear-gradient(150deg, #f8faff, #fff);
  }
  .kpi span { display: block; font-size: 10px; color: var(--muted); }
  .kpi b { display: block; margin-top: 7px; font-size: 20px; letter-spacing: -.02em; }
  .kpi em { display: block; margin-top: 4px; font-style: normal; font-size: 9.5px; color: #8a93ad; }
  .grid { display: grid; grid-template-columns: 1.35fr .85fr; gap: 11px; margin-top: 11px; }
  .card { padding: 14px 15px; border: 1px solid var(--line); border-radius: 13px; break-inside: avoid; }
  .card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 9px; }
  .card-head h2 { margin: 0; font-size: 12px; }
  .card-head p { margin: 3px 0 0; font-size: 9.5px; color: var(--muted); }
  .pill {
    display: inline-flex; align-items: center; height: 20px; padding: 0 8px; border-radius: 999px;
    background: var(--accent-soft); color: #3e5bd8; font-size: 9px; font-weight: 700; white-space: nowrap;
  }
  .chart-svg { display: block; width: 100%; height: auto; }
  .axis { font-size: 9px; fill: #8a93ad; font-family: inherit; }
  .axis-title { font-size: 8px; fill: #a0a8bd; letter-spacing: .04em; }
  .bars { display: flex; flex-direction: column; gap: 9px; }
  .bar-row { display: grid; grid-template-columns: 76px 1fr 30px; align-items: center; gap: 8px; }
  .bar-label { font-size: 9.5px; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .bar-track { height: 8px; border-radius: 999px; background: #eef1f9; overflow: hidden; }
  .bar-track i { display: block; height: 100%; border-radius: 999px; background: linear-gradient(90deg, #7e9bff, #5b7cfa); }
  .bar-value { font-size: 10px; text-align: right; }
  .donut-wrap { display: flex; align-items: center; gap: 14px; }
  .donut-svg { width: 113px; height: 113px; flex: none; }
  .donut-value { font-size: 18px; font-weight: 800; fill: #141a36; }
  .donut-label { font-size: 8px; fill: #8a93ad; letter-spacing: .06em; text-transform: uppercase; }
  .mini-stats { display: flex; flex-direction: column; gap: 8px; width: 100%; }
  .mini-stat { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; padding-bottom: 7px; border-bottom: 1px solid #f0f2f9; }
  .mini-stat:last-child { border-bottom: 0; padding-bottom: 0; }
  .mini-stat span { font-size: 9.5px; color: var(--muted); }
  .mini-stat b { font-size: 12px; }
  .footer {
    display: flex; justify-content: space-between; gap: 16px; margin-top: 13px;
    padding-top: 9px; border-top: 1px solid var(--line);
    font-size: 8.5px; color: #8a93ad;
  }
  .empty { padding: 18px 0; font-size: 10px; color: #8a93ad; text-align: center; }
  @page { size: A4 portrait; margin: 10mm; }
  @media print {
    .page { width: auto; margin: 0; padding: 0; }
  }
</style>
</head>
<body>
  <main class="page">
    <header class="hero">
      <div class="hero-brand">
        <div class="hero-mark">${escapeHtml((school.name || 'Kalanso').slice(0, 2).toUpperCase())}</div>
        <div>
          <h1>${escapeHtml(school.full_name || school.name || 'École Internationale Kalanso')}</h1>
          <p>${escapeHtml(school.address || '')}${school.phone ? ` · ${escapeHtml(school.phone)}` : ''}</p>
        </div>
      </div>
      <div class="hero-meta">
        <b>Tableau de bord</b>
        ${escapeHtml(meta?.academic_year?.label || 'Année scolaire')} · ${escapeHtml(meta?.term?.name || '')}
        <br>Généré le ${escapeHtml(reportDate)}
      </div>
    </header>

    <div class="eyebrow">Indicateurs clés</div>
    <section class="kpis">
      ${kpiCards.map((item) => `
        <div class="kpi">
          <span>${escapeHtml(item.label)}</span>
          <b>${escapeHtml(item.value)}</b>
          <em>${escapeHtml(item.hint)}</em>
        </div>
      `).join('')}
    </section>

    <section class="card" style="margin-top:11px">
      <div class="card-head">
        <div>
          <h2>Recouvrement mensuel</h2>
          <p>Encaissements de l’exercice · en millions de ${escapeHtml(currency)}</p>
        </div>
        <span class="pill">${escapeHtml(compactMoney(recovery, currency))}</span>
      </div>
      ${monthlyChart(series, currency)}
    </section>

    <div class="grid">
      <section class="card">
        <div class="card-head">
          <div>
            <h2>Répartition des effectifs</h2>
            <p>${number(studentCount)} élèves · ${number(classCount)} classes</p>
          </div>
          <span class="pill">${number(distribution.length)} niveaux</span>
        </div>
        ${classBars(distribution)}
      </section>

      <section class="card">
        <div class="card-head">
          <div>
            <h2>Assiduité</h2>
            <p>Taux de présence moyen ce mois</p>
          </div>
        </div>
        <div class="donut-wrap">
          ${attendanceDonut(attendance)}
          <div class="mini-stats">
            <div class="mini-stat"><span>Élèves</span><b>${number(studentCount)}</b></div>
            <div class="mini-stat"><span>Classes</span><b>${number(classCount)}</b></div>
            <div class="mini-stat"><span>Cours aujourd’hui</span><b>${number(today.length)}</b></div>
            <div class="mini-stat"><span>Recouvrement</span><b>${escapeHtml(compactMoney(recovery, currency))}</b></div>
          </div>
        </div>
      </section>
    </div>

    <footer class="footer">
      <span>${escapeHtml(school.name || 'Kalanso')} · ${escapeHtml(school.email || '')}</span>
      <span>Rapport généré automatiquement le ${escapeHtml(date(new Date()))} — ${escapeHtml(money(recovery, currency))} recouvrés</span>
    </footer>
  </main>
</body>
</html>`;

  printHtml(html);
}

const INVOICE_TONES = {
  paid: { label: 'Payée', fg: '#237452', bg: '#e8f7ef' },
  pending: { label: 'En attente', fg: '#a56613', bg: '#fdf3e1' },
  partial: { label: 'Partiellement payée', fg: '#a56613', bg: '#fdf3e1' },
  cancelled: { label: 'Annulée', fg: '#b24141', bg: '#fdecec' },
};

export function exportInvoiceReport({
  invoice, paidAmount, balance, meta, currency = 'FCFA',
}) {
  const school = meta?.school || {};
  const student = invoice?.student || {};
  const studentName = student.full_name
    || [student.first_name, student.last_name].filter(Boolean).join(' ')
    || 'Élève';
  const payments = Array.isArray(invoice?.payments) ? invoice.payments : [];
  const amount = Number(invoice?.amount || 0);
  const paid = Number(paidAmount ?? payments
    .filter((payment) => payment.status === 'completed')
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0));
  const remaining = Math.max(0, Number(balance ?? (amount - paid)));
  const status = INVOICE_TONES[invoice?.status] || INVOICE_TONES.pending;
  const statusLabel = INVOICE_STATUS[invoice?.status]?.label || status.label;
  const feeLabel = invoice?.fee_type?.name || invoice?.feeType?.name || 'Frais de scolarité';
  const termLabel = invoice?.term?.name || meta?.term?.name || '—';
  const reference = invoice?.reference || `FAC-${invoice?.id || ''}`;
  const issuedOn = date(invoice?.issued_on);
  const dueOn = date(invoice?.due_on);
  const reportDate = generatedAt();

  const paymentRows = payments.length
    ? payments.map((payment) => {
      const method = PAYMENT_METHODS[payment.method] || payment.method || '—';
      const paymentStatus = PAYMENT_STATUS[payment.status]?.label || payment.status || 'Validé';
      return `
        <tr>
          <td>${escapeHtml(date(payment.paid_on))}</td>
          <td>${escapeHtml(payment.reference || `PAY-${payment.id || ''}`)}</td>
          <td>${escapeHtml(method)}</td>
          <td>${escapeHtml(paymentStatus)}</td>
          <td class="num">${escapeHtml(money(payment.amount, currency))}</td>
        </tr>
      `;
    }).join('')
    : '<tr><td colspan="5" class="empty">Aucun paiement enregistré pour cette facture.</td></tr>';

  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Kalanso — Facture ${escapeHtml(reference)}</title>
<style>
  :root {
    --ink: #141a36;
    --muted: #667092;
    --line: #e2e7f4;
    --accent: #5b7cfa;
    --accent-soft: #eef1ff;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: Inter, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: var(--ink);
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page { width: 190mm; margin: 0 auto; padding: 9mm 0; }
  .top {
    display: flex; justify-content: space-between; align-items: flex-start; gap: 24px;
    padding-bottom: 16px; border-bottom: 2px solid #141a36;
  }
  .brand { display: flex; align-items: center; gap: 12px; min-width: 0; }
  .mark {
    width: 46px; height: 46px; flex: none; display: grid; place-items: center; border-radius: 12px;
    background: linear-gradient(145deg, #7e9bff, #5b7cfa); color: #fff;
    font-weight: 800; font-size: 18px; letter-spacing: .02em;
  }
  .brand h1 { margin: 0; font-size: 19px; letter-spacing: .01em; }
  .brand p { margin: 4px 0 0; font-size: 10px; line-height: 1.5; color: var(--muted); }
  .doc { text-align: right; flex: none; }
  .doc .kicker {
    font-size: 9px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; color: var(--muted);
  }
  .doc h2 { margin: 4px 0 7px; font-size: 23px; letter-spacing: -.02em; }
  .badge {
    display: inline-flex; align-items: center; height: 21px; padding: 0 9px; border-radius: 999px;
    font-size: 9.5px; font-weight: 700; color: ${status.fg}; background: ${status.bg};
  }
  .parties {
    display: grid; grid-template-columns: 1.25fr 1fr; gap: 22px;
    padding: 18px 0; border-bottom: 1px solid var(--line);
  }
  .parties h3, .section-title {
    margin: 0 0 8px; font-size: 9px; font-weight: 700; letter-spacing: .16em;
    text-transform: uppercase; color: var(--muted);
  }
  .parties .student b { display: block; font-size: 16px; }
  .parties .student p { margin: 5px 0 0; font-size: 10.5px; line-height: 1.55; color: var(--muted); }
  .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 18px; }
  .meta span { display: block; font-size: 9px; color: var(--muted); }
  .meta b { display: block; margin-top: 3px; font-size: 10.5px; }
  .lines { width: 100%; border-collapse: collapse; margin-top: 18px; }
  .lines th {
    padding: 9px 10px; text-align: left; font-size: 9px; letter-spacing: .1em; text-transform: uppercase;
    color: var(--muted); background: #f5f7ff; border-bottom: 1px solid var(--line);
  }
  .lines td { padding: 12px 10px; font-size: 11px; border-bottom: 1px solid var(--line); vertical-align: top; }
  .lines td em { display: block; margin-top: 4px; font-style: normal; font-size: 9.5px; color: var(--muted); }
  .lines .num, .totals .num, .payments .num { text-align: right; white-space: nowrap; }
  .totals { display: flex; justify-content: flex-end; padding: 16px 0 4px; }
  .totals table { width: 76mm; border-collapse: collapse; }
  .totals td { padding: 7px 0; font-size: 10.5px; }
  .totals tr + tr td { border-top: 1px solid #f0f2f9; }
  .totals .grand td { padding-top: 10px; border-top: 2px solid #141a36; font-size: 14px; font-weight: 800; }
  .totals .grand td:last-child { color: ${remaining > 0 ? '#b24141' : '#237452'}; }
  .notes {
    margin-top: 12px; padding: 11px 13px; border-radius: 10px;
    background: #f8faff; border: 1px solid var(--line); font-size: 10.5px; line-height: 1.55;
  }
  .notes b { display: block; margin-bottom: 4px; font-size: 9px; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); }
  .payments { margin-top: 20px; break-inside: avoid; }
  .payments table { width: 100%; border-collapse: collapse; }
  .payments th {
    padding: 8px 9px; text-align: left; font-size: 8.5px; letter-spacing: .1em; text-transform: uppercase;
    color: var(--muted); background: #f5f7ff; border-bottom: 1px solid var(--line);
  }
  .payments td { padding: 8px 9px; font-size: 10px; border-bottom: 1px solid var(--line); }
  .payments .empty, .empty { text-align: center; color: var(--muted); font-style: italic; }
  .footer {
    display: flex; justify-content: space-between; gap: 18px; margin-top: 24px; padding-top: 10px;
    border-top: 1px solid var(--line); font-size: 8.5px; color: #8a93ad;
  }
  @page { size: A4 portrait; margin: 10mm; }
  @media print {
    .page { width: auto; margin: 0; padding: 0; }
  }
</style>
</head>
<body>
  <main class="page">
    <header class="top">
      <div class="brand">
        <div class="mark">${escapeHtml((school.name || 'Kalanso').slice(0, 2).toUpperCase())}</div>
        <div>
          <h1>${escapeHtml(school.full_name || school.name || 'École Internationale Kalanso')}</h1>
          <p>
            ${escapeHtml(school.address || '')}<br>
            ${escapeHtml([school.phone, school.email].filter(Boolean).join(' · '))}
          </p>
        </div>
      </div>
      <div class="doc">
        <div class="kicker">Facture</div>
        <h2>${escapeHtml(reference)}</h2>
        <span class="badge">${escapeHtml(statusLabel)}</span>
      </div>
    </header>

    <section class="parties">
      <div class="student">
        <h3>Facturé à</h3>
        <b>${escapeHtml(studentName)}</b>
        <p>
          ${escapeHtml(student.matricule || '—')} · ${escapeHtml(student.school_class?.name || student.schoolClass?.name || 'Sans classe')}<br>
          ${student.guardian_name ? `Tuteur : ${escapeHtml(student.guardian_name)}` : ''}
          ${student.guardian_phone ? ` · ${escapeHtml(student.guardian_phone)}` : ''}
        </p>
      </div>
      <div class="meta">
        <div><span>Date d’émission</span><b>${escapeHtml(issuedOn)}</b></div>
        <div><span>Échéance</span><b>${escapeHtml(dueOn)}</b></div>
        <div><span>Période</span><b>${escapeHtml(termLabel)}</b></div>
        <div><span>Année scolaire</span><b>${escapeHtml(meta?.academic_year?.label || '—')}</b></div>
      </div>
    </section>

    <table class="lines">
      <thead>
        <tr>
          <th>Désignation</th>
          <th>Période</th>
          <th class="num">Montant</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <b>${escapeHtml(feeLabel)}</b>
            <em>Frais de scolarité de ${escapeHtml(studentName)}</em>
          </td>
          <td>${escapeHtml(termLabel)}</td>
          <td class="num">${escapeHtml(money(amount, currency))}</td>
        </tr>
      </tbody>
    </table>

    <section class="totals">
      <table>
        <tr><td>Montant facturé</td><td class="num">${escapeHtml(money(amount, currency))}</td></tr>
        <tr><td>Déjà réglé</td><td class="num">${escapeHtml(money(paid, currency))}</td></tr>
        <tr class="grand"><td>Net à payer</td><td class="num">${escapeHtml(money(remaining, currency))}</td></tr>
      </table>
    </section>

    ${invoice?.notes ? `
      <div class="notes">
        <b>Notes</b>
        ${escapeHtml(invoice.notes)}
      </div>
    ` : ''}

    <section class="payments">
      <h3 class="section-title">Paiements enregistrés</h3>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Référence</th>
            <th>Moyen</th>
            <th>Statut</th>
            <th class="num">Montant</th>
          </tr>
        </thead>
        <tbody>${paymentRows}</tbody>
      </table>
    </section>

    <footer class="footer">
      <span>${escapeHtml(school.name || 'Kalanso')} · ${escapeHtml(school.email || '')}</span>
      <span>Facture générée le ${escapeHtml(reportDate)}</span>
    </footer>
  </main>
</body>
</html>`;

  printHtml(html);
}
