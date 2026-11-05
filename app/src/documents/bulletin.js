/* ============================================================
   Kalanso — Bulletin scolaire PDF
   Document A4 avec en-tête de l'établissement, notes par
   évaluation, moyennes, rang, mentions et cachet.
   ============================================================ */

import {
  PRINT_CSS, escapeHtml, formatDateFr, formatAmount, letterhead, pageFooter, round2,
} from './common.js';
import { printPdf } from './print-pdf.js';

const evaluationScore = (subject, key) => {
  const grade = (subject?.grades || []).find((entry) => entry.evaluation === key);
  return grade ? Number(grade.score) : null;
};

const cell = (value) => (value === null || value === undefined || value === '' ? '—' : String(value));
const numCell = (value) => {
  if (value === null) return '<span class="num" style="color:#9aa0bd">—</span>';
  return `<span class="num">${round2(value)}</span>`;
};
const fullName = (s) => [s?.first_name, s?.last_name].filter(Boolean).join(' ') || '—';
const slug = (value) => String(value || 'periode').toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'periode';

export function buildBulletinHtml({ student, report, meta, absences }) {
  const school = meta?.school || {};
  const subjects = report?.subjects || [];
  const term = report?.term?.name || meta?.term?.name || 'Période';
  const yearName = meta?.academic_year?.label || '';
  const studentClass = student?.school_class || {};

  let totalCoefficients = 0;
  let totalPoints = 0;
  subjects.forEach((subject) => {
    const coefficient = Number(subject.coefficient || 0);
    const average = subject.average == null ? null : Number(subject.average);
    totalCoefficients += coefficient;
    if (average != null) totalPoints += average * coefficient;
  });

  const generalAverage = report?.general_average == null ? null : Number(report.general_average);
  const mention = report?.mention || '';
  const rank = report?.rank;
  const classSize = report?.class_size;

  const rows = subjects.map((subject) => {
    const coefficient = Number(subject.coefficient || 0);
    const average = subject.average == null ? null : Number(subject.average);
    const points = average == null ? null : round2(average * coefficient);
    return `<tr>
      <td><strong>${escapeHtml(subject.subject || '—')}</strong></td>
      <td>${escapeHtml(subject.code || '—')}</td>
      <td class="num">${coefficient}</td>
      <td class="num">${numCell(evaluationScore(subject, 'devoir_1'))}</td>
      <td class="num">${numCell(evaluationScore(subject, 'devoir_2'))}</td>
      <td class="num">${numCell(evaluationScore(subject, 'composition'))}</td>
      <td class="num">${numCell(average)}</td>
      <td class="num">${numCell(points)}</td>
    </tr>`;
  }).join('\n');

  const subjectRows = subjects.length
    ? rows
    : '<tr><td colspan="8" style="text-align:center;padding:8mm 2mm;color:#6b7295">Aucune note saisie pour cette période.</td></tr>';

  const absencesLine = absences
    ? `${formatAmount(absences.total ?? 0)} heure(s) au total${(absences.unjustified ?? 0) > 0 ? ` · ${formatAmount(absences.unjustified)} non justifiée(s)` : ''}`
    : '—';

  const birth = student?.birth_date ? formatDateFr(student.birth_date, { long: true }) : '—';
  const gender = student?.gender === 'F' ? 'Féminin' : student?.gender === 'M' ? 'Masculin' : '—';

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Bulletin scolaire — ${escapeHtml(fullName(student))}</title>
  <style>${PRINT_CSS}</style>
</head>
<body>
  ${letterhead(meta)}

  <div class="doc-title">
    <h2>Bulletin scolaire</h2>
    <p>${escapeHtml(yearName ? `Année scolaire ${yearName} · ` : '')}${escapeHtml(term)}</p>
  </div>

  <dl class="meta-grid">
    <div class="meta-row"><dt>Élève</dt><dd>${escapeHtml(fullName(student))}</dd></div>
    <div class="meta-row"><dt>Matricule</dt><dd>${escapeHtml(student?.matricule || '—')}</dd></div>
    <div class="meta-row"><dt>Classe</dt><dd>${escapeHtml(studentClass.name || '—')}</dd></div>
    <div class="meta-row"><dt>Niveau</dt><dd>${escapeHtml(studentClass.level || '—')}</dd></div>
    <div class="meta-row"><dt>Naissance</dt><dd>${escapeHtml(birth)} · ${escapeHtml(gender)}</dd></div>
    <div class="meta-row"><dt>Effectif / Rang</dt><dd>${classSize != null ? escapeHtml(`${classSize} élèves`) : '—'}${rank != null ? ` · ${escapeHtml(`${rank}e`)}` : ''}</dd></div>
    <div class="meta-row"><dt>Tuteur</dt><dd>${escapeHtml(student?.guardian_name || '—')}</dd></div>
    <div class="meta-row"><dt>Téléphone</dt><dd>${escapeHtml(student?.guardian_phone || '—')}</dd></div>
  </dl>

  <table class="doc">
    <thead>
      <tr>
        <th>Matière</th><th>Code</th><th class="num">Coef.</th>
        <th class="num">Devoir 1</th><th class="num">Devoir 2</th><th class="num">Composit&deg;</th>
        <th class="num">Moy. / 20</th><th class="num">Points</th>
      </tr>
    </thead>
    <tbody>
${subjectRows}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="2">Totaux</td>
        <td class="num">${totalCoefficients}</td>
        <td colspan="3"></td>
        <td class="num">${generalAverage != null ? `${round2(generalAverage)} / 20` : '—'}</td>
        <td class="num">${round2(totalPoints)}</td>
      </tr>
    </tfoot>
  </table>

  <dl class="meta-grid">
    <div class="meta-row"><dt>Moyenne générale</dt><dd>${generalAverage != null ? `${round2(generalAverage)} / 20` : '—'}</dd></div>
    <div class="meta-row"><dt>Mention</dt><dd class="mention">${escapeHtml(mention || '—')}</dd></div>
    <div class="meta-row"><dt>Rang</dt><dd>${rank != null ? `${rank}${classSize ? ` / ${classSize}` : ''}` : '—'}</dd></div>
    <div class="meta-row"><dt>Absences</dt><dd>${escapeHtml(absencesLine)}</dd></div>
  </dl>

  <div class="appreciation">
    <span class="label">Appréciation du conseil de classe</span>
    <div class="lines"></div>
  </div>

  <div class="sig">
    <div>Le professeur principal<small>Signature</small></div>
    <div>Le Censeur<small>Signature</small></div>
    <div>Le Directeur${school.name ? ` — ${escapeHtml(school.name)}` : ''}<small>Signature et cachet</small></div>
  </div>

  ${pageFooter([
    `Bulletin imprimé le ${formatDateFr(new Date())} par Kalanso — ${escapeHtml(school.name || 'l’établissement')}.`,
    'Les notes sont provisoires et ne deviennent définitives qu’après la délibération du conseil de classe.',
  ])}
</body>
</html>`;
}

export async function printBulletinPdf({ student, report, meta, absences }) {
  const term = report?.term?.name || meta?.term?.name || 'periode';
  const filename = `Bulletin-${student?.matricule || 'eleve'}-${slug(term)}.pdf`;
  const html = buildBulletinHtml({ student, report, meta, absences });
  return printPdf(html, filename);
}
