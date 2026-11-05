/* ============================================================
   Kalanso — Reçu de paiement PDF
   Document A4, montant en chiffres et en lettres, en-tête de
   l'établissement : preuve de paiement remise au parent.
   ============================================================ */

import {
  PRINT_CSS, escapeHtml, formatDateFr, formatAmount, letterhead, pageFooter,
} from './common.js';
import { montantEnLettresFr } from './number-words.js';
import { printPdf } from './print-pdf.js';

const METHOD_LABELS = {
  cash: 'Espèces',
  mobile_money: 'Mobile money',
  bank: 'Virement bancaire',
  card: 'Carte bancaire',
  other: 'Autre',
};

const STATUS_LABELS = {
  completed: 'Encaissé',
  pending: 'En attente',
  failed: 'Échoué',
  refunded: 'Remboursé',
};

const fullName = (s) => [s?.first_name, s?.last_name].filter(Boolean).join(' ')
  || (s?.full_name ? s.full_name : '—');

export function buildReceiptHtml({ payment, meta, currency = 'FCFA' }) {
  const school = meta?.school || {};
  const student = payment?.student || {};
  const invoice = payment?.invoice || null;
  const amount = Number(payment?.amount || 0);
  const number = payment?.reference || `PAY-${payment?.id ?? ''}`;
  const receiptDate = payment?.paid_on ? formatDateFr(payment.paid_on, { long: true }) : formatDateFr(new Date());
  const method = METHOD_LABELS[payment?.method] || payment?.method || '—';
  const status = STATUS_LABELS[payment?.status] || payment?.status || 'Encaissé';
  const className = student?.school_class?.name || '';
  const invoiceAmount = invoice?.amount != null ? `${formatAmount(invoice.amount)} ${currency}` : null;

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Reçu de paiement — ${escapeHtml(number)}</title>
  <style>${PRINT_CSS}
.recu-box {
  max-width: 165mm; margin: 0 auto;
  border: .7pt solid #dfe4f2; border-radius: 2mm;
  padding: 6mm 8mm; background: #fff;
}
.recu-head {
  display: flex; align-items: flex-start; justify-content: space-between;
  border-bottom: .6pt solid #10163a; padding-bottom: 4mm; margin-bottom: 5mm;
}
.recu-head h3 {
  margin: 0; font-family: Georgia, serif; font-size: 14pt; color: #10163a;
  letter-spacing: .18em; text-transform: uppercase;
}
.recu-head p { margin: 1.5mm 0 0; font-size: 8pt; color: #6b7295; }
.recu-number { text-align: right; }
.recu-number .label {
  display: block; font-size: 6.2pt; letter-spacing: .14em;
  text-transform: uppercase; color: #8a6a34; font-weight: 700;
}
.recu-number .ref {
  display: block; margin-top: 1.2mm;
  font-family: 'Courier New', monospace; font-size: 12pt; font-weight: 700;
  color: #10163a;
}
.recu-amount {
  background: #10163a; border-radius: 1.5mm; color: #f4f6ff;
  text-align: center; padding: 5mm 6mm; margin-bottom: 5mm;
}
.recu-amount .label {
  display: block; font-size: 6.2pt; letter-spacing: .18em;
  text-transform: uppercase; color: #9aa6d8; font-weight: 700;
}
.recu-amount .value {
  display: block; margin-top: 2mm;
  font-family: Georgia, serif; font-size: 24pt; font-weight: 700;
}
.recu-amount .words {
  display: block; margin-top: 2mm;
  font-size: 8pt; font-style: italic; color: #c7cdf2;
}
.recu-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 3mm 8mm;
  margin-bottom: 5mm;
}
.recu-field { border-bottom: .4pt dotted #dfe4f2; padding-bottom: 2mm; }
.recu-field .label {
  display: block; font-size: 6.2pt; letter-spacing: .14em;
  text-transform: uppercase; color: #6b7295; margin-bottom: 1mm;
}
.recu-field b { font-size: 9.5pt; color: #141a33; }
.recu-status {
  display: inline-block; margin-top: 1mm; padding: 1mm 4mm;
  border-radius: 99mm; background: #e9f7ef; color: #1c7c4a;
  font-size: 7pt; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
}
.recu-sign {
  display: flex; justify-content: space-between; gap: 12mm;
  margin-top: 7mm; font-size: 8.4pt; color: #3d4568;
}
.recu-sign > div { flex: 1; text-align: center; }
.recu-sign .line {
  margin-top: 14mm; border-top: .6pt solid #10163a; padding-top: 2mm;
  font-size: 7.4pt; font-weight: 600;
}
.recu-sign small { display: block; font-size: 6pt; color: #8a8fb0; letter-spacing: .1em; text-transform: uppercase; margin-top: 1mm; }
  </style>
</head>
<body>
  ${letterhead(meta)}

  <div class="recu-box">
    <div class="recu-head">
      <div>
        <h3>Reçu de paiement</h3>
        <p>${escapeHtml(school.full_name || school.name || 'Kalanso')}</p>
      </div>
      <div class="recu-number">
        <span class="label">N° du reçu</span>
        <span class="ref">${escapeHtml(number)}</span>
      </div>
    </div>

    <div class="recu-amount">
      <span class="label">Montant encaissé</span>
      <span class="value">${formatAmount(amount)} ${escapeHtml(currency)}</span>
      <span class="words">${escapeHtml(montantEnLettresFr(amount))}.</span>
    </div>

    <div class="recu-grid">
      <div class="recu-field">
        <span class="label">Élève</span>
        <b>${escapeHtml(fullName(student))}${className ? ` — ${escapeHtml(className)}` : ''}</b>
      </div>
      <div class="recu-field">
        <span class="label">Matricule</span>
        <b>${escapeHtml(student?.matricule || '—')}</b>
      </div>
      <div class="recu-field">
        <span class="label">Date du paiement</span>
        <b>${escapeHtml(receiptDate)}</b>
      </div>
      <div class="recu-field">
        <span class="label">Moyen de paiement</span>
        <b>${escapeHtml(method)}</b>
      </div>
      ${invoice ? `<div class="recu-field">
        <span class="label">Facture réglée</span>
        <b>${escapeHtml(invoice.reference || '—')}${invoiceAmount ? ` · ${escapeHtml(invoiceAmount)}` : ''}</b>
      </div>` : `<div class="recu-field">
        <span class="label">Facture</span>
        <b>Paiement libre</b>
      </div>`}
      <div class="recu-field">
        <span class="label">Statut</span>
        <span class="recu-status">${escapeHtml(status)}</span>
      </div>
    </div>

    <div class="recu-sign">
      <div><div class="line">Le caissier / comptable<small>Signature et cachet</small></div></div>
      <div><div class="line">Le parent / tuteur<small>Signature précédée de « Lu et approuvé »</small></div></div>
    </div>
  </div>

  ${pageFooter([
    `Reçu généré par Kalanso le ${formatDateFr(new Date())} — ${escapeHtml(school.name || 'l’établissement')}.`,
    'Ce document atteste le paiement. Conservez-le précieusement.',
  ])}
</body>
</html>`;
}

export async function printReceiptPdf({ payment, meta, currency }) {
  const number = payment?.reference || `PAY-${payment?.id ?? 'recu'}`;
  const safe = String(number).replace(/[^A-Za-z0-9_.-]+/g, '_');
  const html = buildReceiptHtml({ payment, meta, currency });
  return printPdf(html, `Recu-${safe}.pdf`);
}
