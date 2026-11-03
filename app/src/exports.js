import { api } from './api.js';
import { exportXlsx } from './xlsx.js';
import {
  DAYS, EVALUATIONS, STUDENT_STATUS, INVOICE_STATUS, PAYMENT_STATUS,
  PAYMENT_METHODS, ADMISSION_STATUS, date, dateInput, fullName, money, number,
} from './data.jsx';
import { weekDayNumber } from './week.js';

/* ============================================================
   Kalanso — exports Excel métier
   Tous les tableaux sont bordés et séparés par classe.
   ============================================================ */

const LEVEL_RANK = { Seconde: 1, Première: 2, Terminale: 3 };
const collator = new Intl.Collator('fr', { sensitivity: 'base', numeric: true });

const classOf = (row) => row.school_class?.name || row.schoolClass?.name || 'Sans classe';
const levelOf = (row) => row.school_class?.level || row.schoolClass?.level || 'Sans niveau';
const streamOf = (row) => {
  const name = classOf(row);
  const level = row.school_class?.level || row.schoolClass?.level;
  if (!level) return '—';
  return name.toLowerCase().startsWith(level.toLowerCase())
    ? name.slice(level.length).trim() || '—'
    : name;
};

const classSort = (a, b) => (
  (LEVEL_RANK[levelOf(a)] || 9) - (LEVEL_RANK[levelOf(b)] || 9)
  || collator.compare(classOf(a), classOf(b))
  || collator.compare(streamOf(a), streamOf(b))
);

const studentSort = (a, b) => (
  collator.compare(a.last_name || '', b.last_name || '')
  || collator.compare(a.first_name || '', b.first_name || '')
);

const range = (firstColumn, lastColumn, row) => (
  `${firstColumn}${row}:${lastColumn}${row}`
);

const columnLetter = (index) => {
  if (index <= 26) return String.fromCharCode(64 + index);
  return `A${String.fromCharCode(64 + index - 26)}`;
};

const titleRows = (title, subtitle, width) => [
  {
    height: 26,
    cells: Array.from({ length: width }, (_, index) => ({ v: index === 0 ? title : '', s: 'title' })),
  },
  {
    height: 18,
    cells: Array.from({ length: width }, (_, index) => ({ v: index === 0 ? subtitle : '', s: 'subtitle' })),
  },
  { height: 8, cells: [] },
];

const filesafe = (value) => String(value || 'export')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-zA-Z0-9-_]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .toLowerCase();

export async function fetchAllStudents() {
  const students = [];
  let page = 1;
  let lastPage = 1;
  do {
    const payload = await api.get('/students', { query: { per_page: 500, page } });
    students.push(...(payload?.data || []));
    lastPage = Number(payload?.last_page) || page;
    page += 1;
  } while (page <= lastPage && page <= 50);
  return students;
}

export async function fetchAllGrades() {
  const grades = [];
  let page = 1;
  let lastPage = 1;
  do {
    const payload = await api.get('/grades', { query: { per_page: 1000, page } });
    grades.push(...(payload?.data || []));
    lastPage = Number(payload?.last_page) || page;
    page += 1;
  } while (page <= lastPage && page <= 20);
  return grades;
}

export async function fetchLatestExamGrades(classId) {
  const grades = [];
  let page = 1;
  let lastPage = 1;
  let exam = null;
  do {
    const payload = await api.get('/grades', {
      query: {
        latest_exam: 1,
        per_page: 1000,
        page,
        class_id: classId || undefined,
      },
    });
    grades.push(...(payload?.data || []));
    exam = exam || payload?.latest_exam || null;
    lastPage = Number(payload?.last_page) || page;
    page += 1;
  } while (page <= lastPage && page <= 20);
  return { grades, exam };
}

export async function fetchAllTimetableSlots() {
  const payload = await api.get('/timetable');
  return payload?.slots || [];
}

/* ---------- élèves ---------- */

export async function exportStudentsWorkbook(students, options = {}) {
  const { schoolName = 'Kalanso', termName = '' } = options;
  const sorted = [...students].sort((a, b) => classSort(a, b) || studentSort(a, b));
  const groups = [];
  sorted.forEach((student) => {
    const name = classOf(student);
    let group = groups.find((item) => item.name === name);
    if (!group) {
      group = {
        name,
        level: levelOf(student),
        stream: streamOf(student),
        students: [],
      };
      groups.push(group);
    }
    group.students.push(student);
  });

  const headers = [
    'Matricule', 'Nom', 'Prénom', 'Sexe', 'Naissance', 'Statut',
    'Moyenne', 'Solde', 'Tuteur', 'Téléphone tuteur', 'Email tuteur', 'Inscription',
  ];
  const widths = [13, 18, 15, 9, 11, 12, 9, 11, 24, 16, 26, 11];
  const rows = titleRows(
    'Liste des élèves par classe et filière',
    `${schoolName}${termName ? ` · ${termName}` : ''} · ${students.length} élève${students.length > 1 ? 's' : ''} · ${groups.length} classe${groups.length > 1 ? 's' : ''}`,
    headers.length,
  );
  const merges = [range('A', columnLetter(headers.length), 1), range('A', columnLetter(headers.length), 2)];

  groups.forEach((group) => {
    rows.push({
      height: 22,
      cells: Array.from({ length: headers.length }, (_, index) => ({
        v: index === 0
          ? `${group.name} · ${group.level} · filière ${group.stream} · ${group.students.length} élève${group.students.length > 1 ? 's' : ''}`
          : '',
        s: 'section',
      })),
    });
    merges.push(range('A', 'L', rows.length));
    rows.push({
      height: 30,
      cells: headers.map((header) => ({ v: header, s: 'header' })),
    });
    group.students.forEach((student) => {
      rows.push({
        height: 20,
        cells: [
          { v: student.matricule || '', s: 'cell' },
          { v: student.last_name || '', s: 'cell' },
          { v: student.first_name || '', s: 'cell' },
          { v: student.gender === 'F' ? 'Féminin' : student.gender === 'M' ? 'Masculin' : '', s: 'cell' },
          { v: dateInput(student.birth_date), s: 'date' },
          { v: student.status ? (STUDENT_STATUS[student.status]?.label || student.status.replace(/_/g, ' ')) : '', s: 'cell' },
          { v: student.average == null ? '' : Number(student.average), s: 'number' },
          { v: student.balance == null ? '' : Number(student.balance), s: 'money' },
          { v: student.guardian_name || '', s: 'cell' },
          { v: student.guardian_phone || '', s: 'cell' },
          { v: student.guardian_email || '', s: 'cell' },
          { v: dateInput(student.enrolled_on), s: 'date' },
        ],
      });
    });
    rows.push({ height: 10, cells: [] });
  });

  await exportXlsx(`kalanso-eleves-${dateInput(new Date())}`, [{
    name: 'Élèves',
    columns: widths,
    rows,
    merges,
    freeze: 3,
  }]);
}

/* ---------- notes du dernier examen ---------- */

const normalizeScore = (grade) => (
  (Number(grade.score) / Math.max(1, Number(grade.max_score || 20))) * 20
);

export function buildExamGroups(grades) {
  const byClass = new Map();
  grades.forEach((grade) => {
    const className = grade.school_class?.name || 'Sans classe';
    if (!byClass.has(className)) {
      byClass.set(className, {
        name: className,
        level: grade.school_class?.level || '',
        grades: [],
      });
    }
    byClass.get(className).grades.push(grade);
  });

  return [...byClass.values()]
    .sort((a, b) => (LEVEL_RANK[a.level] || 9) - (LEVEL_RANK[b.level] || 9) || collator.compare(a.name, b.name))
    .map((group) => {
      const subjects = new Map();
      const students = new Map();
      group.grades.forEach((grade) => {
        if (grade.subject?.id && !subjects.has(grade.subject.id)) {
          subjects.set(grade.subject.id, {
            id: grade.subject.id,
            name: grade.subject.name,
            coefficient: Number(grade.subject.coefficient || grade.coefficient || 1),
          });
        }
        if (!students.has(grade.student_id)) {
          students.set(grade.student_id, {
            id: grade.student_id,
            student: grade.student,
            grades: new Map(),
          });
        }
        students.get(grade.student_id).grades.set(grade.subject_id, grade);
      });

      const subjectList = [...subjects.values()]
        .sort((a, b) => b.coefficient - a.coefficient || collator.compare(a.name, b.name));
      const studentList = [...students.values()].map((entry) => {
        let weighted = 0;
        let coefficients = 0;
        subjectList.forEach((subject) => {
          const grade = entry.grades.get(subject.id);
          if (!grade) return;
          const coefficient = Number(grade.coefficient || subject.coefficient || 1);
          weighted += normalizeScore(grade) * coefficient;
          coefficients += coefficient;
        });
        return {
          ...entry,
          average: coefficients ? Math.round((weighted / coefficients) * 100) / 100 : null,
        };
      }).sort((a, b) => studentSort(a.student, b.student));

      const ranked = [...studentList]
        .filter((entry) => entry.average != null)
        .sort((a, b) => b.average - a.average);
      ranked.forEach((entry, index) => {
        entry.rank = index > 0 && entry.average === ranked[index - 1].average
          ? ranked[index - 1].rank
          : index + 1;
      });

      const averages = studentList.map((entry) => entry.average).filter((value) => value != null);
      const classAverage = averages.length
        ? averages.reduce((sum, value) => sum + value, 0) / averages.length
        : null;

      return {
        ...group,
        subjects: subjectList,
        students: studentList,
        classAverage,
        successRate: averages.length
          ? Math.round((averages.filter((value) => value >= 10).length / averages.length) * 100)
          : 0,
      };
    });
}

export async function exportLatestExamWorkbook(grades, exam, options = {}) {
  const { schoolName = 'Kalanso' } = options;
  const groups = buildExamGroups(grades);
  const maxSubjects = Math.max(1, ...groups.map((group) => group.subjects.length));
  const width = 2 + maxSubjects + 2;
  const rows = titleRows(
    'Notes du dernier examen',
    [
      schoolName,
      exam?.date ? date(exam.date) : '',
      exam?.evaluation ? (EVALUATIONS[exam.evaluation] || exam.evaluation) : '',
      exam?.term || '',
      `${grades.length} note${grades.length > 1 ? 's' : ''}`,
      `${groups.length} classe${groups.length > 1 ? 's' : ''}`,
    ].filter(Boolean).join(' · '),
    width,
  );
  const merges = [
    range('A', columnLetter(width), 1),
    range('A', columnLetter(width), 2),
  ];

  if (!groups.length) {
    rows.push({
      height: 30,
      cells: [{ v: 'Aucune note enregistrée pour le dernier examen.', s: 'cell' }],
    });
  }

  groups.forEach((group) => {
    const groupWidth = 2 + group.subjects.length + 2;
    rows.push({
      height: 22,
      cells: Array.from({ length: groupWidth }, (_, index) => ({
        v: index === 0
          ? `${group.name} · ${group.students.length} élève${group.students.length > 1 ? 's' : ''}${group.classAverage != null ? ` · moyenne ${group.classAverage.toFixed(2).replace('.', ',')}/20` : ''}`
          : '',
        s: 'section',
      })),
    });
    merges.push(`A${rows.length}:${columnLetter(groupWidth)}${rows.length}`);

    rows.push({
      height: 30,
      cells: [
        { v: 'Matricule', s: 'header' },
        { v: 'Élève', s: 'header' },
        ...group.subjects.map((subject) => ({ v: subject.name, s: 'header' })),
        { v: 'Moyenne', s: 'header' },
        { v: 'Rang', s: 'header' },
      ],
    });

    group.students.forEach((entry) => {
      rows.push({
        height: 20,
        cells: [
          { v: entry.student?.matricule || '', s: 'cell' },
          { v: fullName(entry.student), s: 'cell' },
          ...group.subjects.map((subject) => {
            const grade = entry.grades.get(subject.id);
            return {
              v: grade ? Math.round(normalizeScore(grade) * 100) / 100 : '',
              s: grade ? 'number' : 'empty',
            };
          }),
          { v: entry.average ?? '', s: entry.average != null ? 'average' : 'empty' },
          { v: entry.rank ?? '', s: 'center' },
        ],
      });
    });

    rows.push({
      height: 20,
      cells: [
        { v: 'Moyenne de la classe', s: 'total' },
        { v: '', s: 'total' },
        ...group.subjects.map(() => ({ v: '', s: 'total' })),
        { v: group.classAverage != null ? Math.round(group.classAverage * 100) / 100 : '', s: 'total' },
        { v: `${group.successRate} % ≥ 10`, s: 'total' },
      ],
    });
    rows.push({ height: 10, cells: [] });
  });

  await exportXlsx(`kalanso-notes-${exam?.date || dateInput(new Date())}`, [{
    name: 'Dernier examen',
    columns: [13, 22, ...Array.from({ length: maxSubjects }, () => 17), 10, 8],
    rows,
    merges,
    freeze: 3,
  }]);
}

/* ---------- emploi du temps ---------- */

const slotSubject = (slot) => slot.subject?.name || 'Cours';
const slotTeacher = (slot) => (slot.staff ? fullName(slot.staff) : '—');
const slotRoom = (slot) => slot.room || slot.school_class?.room || '—';

export async function exportTimetableWorkbook(slots, classes, options = {}) {
  const {
    schoolName = 'Kalanso', termName = '', weekStart = null, weekLabel = '',
  } = options;
  const weekSuffix = weekLabel ? ` · ${weekLabel}` : '';
  const dayTitle = (day) => {
    const name = DAYS[day - 1] || '';
    const number = weekStart ? weekDayNumber(weekStart, day) : '';
    return number ? `${name} ${number}` : name;
  };
  const classList = [...(classes || [])];
  slots.forEach((slot) => {
    if (slot.school_class && !classList.some((item) => item.id === slot.school_class.id)) {
      classList.push(slot.school_class);
    }
  });
  classList.sort((a, b) => (
    (LEVEL_RANK[a.level] || 9) - (LEVEL_RANK[b.level] || 9)
    || collator.compare(a.name || '', b.name || '')
  ));

  const byClass = new Map();
  slots.forEach((slot) => {
    const id = slot.school_class_id || slot.school_class?.id;
    if (!byClass.has(id)) byClass.set(id, []);
    byClass.get(id).push(slot);
  });
  byClass.forEach((list) => list.sort((a, b) => (
    Number(a.day_of_week || 1) - Number(b.day_of_week || 1)
    || String(a.starts_at || '').localeCompare(String(b.starts_at || ''))
  )));

  /* Feuille de synthèse : une grille hebdomadaire par classe,
     heure à gauche et jours en haut, comme les feuilles individuelles. */
  const allDays = [...new Set(slots.map((slot) => Number(slot.day_of_week)).filter(Boolean))].sort((a, b) => a - b);
  const overviewDays = allDays.length ? allDays : [1, 2, 3, 4, 5];
  const allHours = [...new Set(slots.map((slot) => String(slot.starts_at || '').slice(0, 5)).filter(Boolean))].sort();
  const overviewHours = allHours.length ? allHours : ['08:00', '10:00', '12:00', '14:00', '16:00'];
  const overviewDayHeaders = overviewDays.map((day) => dayTitle(day));
  const overviewColumns = [10, ...overviewDays.map(() => 22)];
  const lastColumn = columnLetter(overviewColumns.length);
  const rows = titleRows(
    'Emplois du temps de toutes les classes',
    `${schoolName}${termName ? ` · ${termName}` : ''}${weekSuffix} · ${classList.length} classe${classList.length > 1 ? 's' : ''} · ${slots.length} cours`,
    overviewColumns.length,
  );
  const merges = [range('A', lastColumn, 1), range('A', lastColumn, 2)];

  classList.forEach((classInfo) => {
    const classSlots = byClass.get(classInfo.id) || [];
    rows.push({
      height: 22,
      cells: Array.from({ length: overviewColumns.length }, (_, index) => ({
        v: index === 0 ? `${classInfo.name} · ${classSlots.length} cours / semaine` : '',
        s: 'section',
      })),
    });
    merges.push(range('A', lastColumn, rows.length));
    rows.push({
      height: 30,
      cells: [{ v: 'Horaire', s: 'header' }, ...overviewDayHeaders.map((day) => ({ v: day, s: 'header' }))],
    });

    if (!classSlots.length) {
      rows.push({
        height: 30,
        cells: [{ v: 'Aucun cours programmé.', s: 'cell' }, ...Array.from({ length: overviewDays.length }, () => ({ v: '', s: 'empty' }))],
      });
    }

    overviewHours.forEach((hour) => {
      rows.push({
        height: 56,
        cells: [
          { v: hour, s: 'center' },
          ...overviewDays.map((day) => {
            const slot = classSlots.find((entry) => (
              Number(entry.day_of_week) === day
              && String(entry.starts_at || '').slice(0, 5) === hour
            ));
            return slot
              ? { v: `${slotSubject(slot)}\n${slotTeacher(slot)}\n${slotRoom(slot)}`, s: 'cell' }
              : { v: '', s: 'empty' };
          }),
        ],
      });
    });
    rows.push({ height: 10, cells: [] });
  });

  const sheets = [{
    name: 'Toutes les classes',
    columns: overviewColumns,
    rows,
    merges,
    freeze: 3,
  }];

  /* Une feuille par classe : grille hebdomadaire imprimable. */
  classList.forEach((classInfo) => {
    const classSlots = byClass.get(classInfo.id) || [];
    const days = [...new Set(classSlots.map((slot) => Number(slot.day_of_week)).filter(Boolean))].sort((a, b) => a - b);
    const activeDays = days.length ? days : [1, 2, 3, 4, 5];
    const hours = [...new Set(classSlots.map((slot) => String(slot.starts_at || '').slice(0, 5)).filter(Boolean))].sort();
    const gridHours = hours.length ? hours : ['08:00', '10:00', '12:00', '14:00', '16:00'];
    const dayHeaders = activeDays.map((day) => dayTitle(day));
    const gridRows = titleRows(
      `${classInfo.name} — emploi du temps`,
      `${schoolName}${termName ? ` · ${termName}` : ''}${weekSuffix} · ${classSlots.length} cours / semaine`,
      dayHeaders.length + 1,
    );
    const gridMerges = [
      `A1:${columnLetter(dayHeaders.length + 1)}1`,
      `A2:${columnLetter(dayHeaders.length + 1)}2`,
    ];
    gridRows.push({
      height: 30,
      cells: [{ v: 'Horaire', s: 'header' }, ...dayHeaders.map((day) => ({ v: day, s: 'header' }))],
    });
    gridHours.forEach((hour) => {
      gridRows.push({
        height: 56,
        cells: [
          { v: hour, s: 'center' },
          ...activeDays.map((day) => {
            const slot = classSlots.find((entry) => (
              Number(entry.day_of_week) === day
              && String(entry.starts_at || '').slice(0, 5) === hour
            ));
            return slot
              ? { v: `${slotSubject(slot)}\n${slotTeacher(slot)}\n${slotRoom(slot)}`, s: 'cell' }
              : { v: '', s: 'empty' };
          }),
        ],
      });
    });

    sheets.push({
      name: classInfo.name,
      columns: [10, ...activeDays.map(() => 22)],
      rows: gridRows,
      merges: gridMerges,
      freeze: 3,
    });
  });

  await exportXlsx(`kalanso-emplois-du-temps-${dateInput(new Date())}`, sheets);
}

/* ============================================================
   Exports métier — tableaux bordés et séparés par section
   ============================================================ */

const generatedLabel = () => new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'long',
  timeStyle: 'short',
}).format(new Date());

const round2 = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : '';
};

const cell = (value, style = 'cell') => ({ v: value ?? '', s: style });
const numberCell = (value, style = 'number') => (
  value === '' || value == null ? { v: '', s: 'empty' } : { v: Number(value), s: style }
);
const moneyCell = (value) => numberCell(value, 'money');
const emptyCell = { v: '', s: 'empty' };

const fillCells = (cells, width, style = 'total') => Array.from(
  { length: width },
  (_, index) => cells[index] || { v: '', s: style },
);

function tableSheet({
  name, title, subtitle, columns, groups, totals = null, freeze = 3, orientation = 'landscape',
}) {
  const width = columns.length;
  const rows = titleRows(title, subtitle, width);
  const merges = [
    range('A', columnLetter(width), 1),
    range('A', columnLetter(width), 2),
  ];

  groups.forEach((group) => {
    rows.push({
      height: 22,
      cells: Array.from({ length: width }, (_, index) => ({
        v: index === 0 ? group.label : '',
        s: 'section',
      })),
    });
    merges.push(range('A', columnLetter(width), rows.length));

    const headers = group.headers || columns.map((column) => column.label);
    rows.push({
      height: 30,
      cells: Array.from({ length: width }, (_, index) => ({
        v: headers[index] || '',
        s: 'header',
      })),
    });

    (group.rows || []).forEach((row) => {
      rows.push({
        height: group.height || 20,
        cells: fillCells(row, width, 'empty'),
      });
    });

    if (group.total) {
      rows.push({
        height: 22,
        cells: fillCells(group.total, width, 'total'),
      });
    }

    rows.push({ height: 10, cells: [] });
  });

  if (totals) {
    rows.push({ height: 24, cells: fillCells(totals, width, 'total') });
  }

  return {
    name,
    columns: columns.map((column) => Number(column.width) || 14),
    rows,
    merges,
    freeze,
    orientation,
  };
}

async function fetchPaged(path, query = {}, maxPages = 60, perPage = 1000) {
  const rows = [];
  let page = 1;
  let lastPage = 1;
  do {
    const payload = await api.get(path, {
      query: { ...query, per_page: perPage, page },
    });
    rows.push(...(payload?.data || []));
    lastPage = Number(payload?.last_page) || page;
    page += 1;
  } while (page <= lastPage && page <= maxPages);
  return rows;
}

export const fetchAllInvoices = (filters = {}) => fetchPaged('/invoices', filters);
export const fetchAllPayments = (filters = {}) => fetchPaged('/payments', filters);
export const fetchAllAbsences = (filters = {}) => fetchPaged('/absences', filters);
export const fetchAllAdmissions = (filters = {}) => fetchPaged('/admissions', filters);

/* ---------- finances ---------- */

export async function exportFinanceSummaryWorkbook(summary, options = {}) {
  const {
    schoolName = 'Kalanso', termName = '', yearName = '', currency = 'FCFA',
  } = options;
  const kpis = summary?.kpis || {};
  const monthly = summary?.monthly || [];
  const byStatus = summary?.by_status || [];
  const byMethod = summary?.by_method || [];
  const byFeeType = summary?.by_fee_type || [];
  const topDebtors = summary?.top_debtors || [];

  const columns = [
    { label: 'Indicateur', width: 34 },
    { label: 'Valeur', width: 18 },
    { label: 'Précision', width: 24 },
    { label: 'Complément', width: 20 },
    { label: 'Détail', width: 18 },
    { label: 'Observation', width: 20 },
  ];

  const groups = [
    {
      label: `Indicateurs clés · exercice ${yearName || 'en cours'}`,
      headers: ['Indicateur', 'Montant', 'Précision'],
      rows: [
        [cell('Montant facturé'), moneyCell(kpis.invoiced), cell(`${number(kpis.collection_rate || 0, 1)} % recouvré`)],
        [cell('Encaissé'), moneyCell(kpis.collected), cell('Paiements validés')],
        [cell('Reste à recouvrer'), moneyCell(kpis.outstanding), cell('Solde des factures ouvertes')],
        [cell('Échéances dépassées'), moneyCell(kpis.overdue), cell('À relancer en priorité')],
      ],
    },
  ];

  if (monthly.length) {
    groups.push({
      label: 'Encaissements mensuels',
      headers: ['Mois', 'Montant encaissé', 'Paiements'],
      rows: monthly.map((row) => [
        cell(row.label),
        moneyCell(row.total),
        numberCell(row.payments),
      ]),
      total: [cell('Total', 'total'), moneyCell(monthly.reduce((sum, row) => sum + Number(row.total || 0), 0)), numberCell(monthly.reduce((sum, row) => sum + Number(row.payments || 0), 0))],
    });
  }

  if (byStatus.length) {
    groups.push({
      label: 'Statut des factures',
      headers: ['Statut', 'Nombre de factures', 'Montant'],
      rows: byStatus.map((row) => [
        cell(INVOICE_STATUS[row.status]?.label || row.status),
        numberCell(row.count),
        moneyCell(row.total),
      ]),
    });
  }

  if (byMethod.length) {
    groups.push({
      label: 'Moyens de paiement',
      headers: ['Moyen', 'Paiements', 'Montant'],
      rows: byMethod.map((row) => [
        cell(PAYMENT_METHODS[row.method] || row.method),
        numberCell(row.payments),
        moneyCell(row.total),
      ]),
    });
  }

  if (byFeeType.length) {
    groups.push({
      label: 'Par nature de frais',
      headers: ['Frais', 'Code', 'Montant facturé'],
      rows: byFeeType.map((row) => [
        cell(row.fee),
        cell(row.code || '—'),
        moneyCell(row.invoiced),
      ]),
    });
  }

  if (topDebtors.length) {
    groups.push({
      label: 'Principaux impayés',
      headers: ['Élève', 'Facture', 'Montant', 'Solde', 'Échéance'],
      rows: topDebtors.map((row) => [
        cell(fullName(row.student)),
        cell(row.reference),
        moneyCell(row.amount),
        moneyCell(row.balance),
        cell(date(row.due_on)),
      ]),
    });
  }

  await exportXlsx(`kalanso-finances-${dateInput(new Date())}`, [
    tableSheet({
      name: 'Synthèse',
      title: 'Synthèse financière',
      subtitle: `${schoolName}${termName ? ` · ${termName}` : ''} · ${generatedLabel()} · montants en ${currency}`,
      columns,
      groups,
    }),
  ]);
}

export async function exportFinanceInvoicesWorkbook(invoices, options = {}) {
  const {
    schoolName = 'Kalanso', termName = '', currency = 'FCFA', filterLabel = '',
  } = options;
  const balanceOf = (invoice) => Math.max(0, Number(invoice.amount || 0) - Number(invoice.paid_amount || 0));
  const totalAmount = invoices.reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0);
  const totalPaid = invoices.reduce((sum, invoice) => sum + Number(invoice.paid_amount || 0), 0);
  const totalBalance = invoices.reduce((sum, invoice) => sum + balanceOf(invoice), 0);

  const columns = [
    { label: 'Référence', width: 16 },
    { label: 'Élève', width: 24 },
    { label: 'Matricule', width: 13 },
    { label: 'Classe', width: 16 },
    { label: 'Frais', width: 20 },
    { label: 'Montant', width: 13 },
    { label: 'Payé', width: 13 },
    { label: 'Solde', width: 13 },
    { label: 'Statut', width: 13 },
    { label: 'Échéance', width: 12 },
  ];

  const groups = Object.entries(INVOICE_STATUS).map(([status, entry]) => {
    const list = invoices.filter((invoice) => invoice.status === status);
    if (!list.length) return null;
    const amount = list.reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0);
    const paid = list.reduce((sum, invoice) => sum + Number(invoice.paid_amount || 0), 0);
    const balance = list.reduce((sum, invoice) => sum + balanceOf(invoice), 0);
    return {
      label: `${entry.label} · ${list.length} facture${list.length > 1 ? 's' : ''} · ${money(amount, currency)}`,
      rows: list.map((invoice) => [
        cell(invoice.reference),
        cell(fullName(invoice.student)),
        cell(invoice.student?.matricule || '—'),
        cell(invoice.student?.school_class?.name || '—'),
        cell(invoice.fee_type?.name || '—'),
        moneyCell(invoice.amount),
        moneyCell(invoice.paid_amount),
        moneyCell(balanceOf(invoice)),
        cell(entry.label),
        cell(date(invoice.due_on)),
      ]),
      total: [
        cell('Sous-total', 'total'),
        cell('', 'total'),
        cell('', 'total'),
        cell('', 'total'),
        cell(`${list.length} facture${list.length > 1 ? 's' : ''}`, 'total'),
        moneyCell(amount),
        moneyCell(paid),
        moneyCell(balance),
        cell('', 'total'),
        cell('', 'total'),
      ],
    };
  }).filter(Boolean);

  await exportXlsx(`kalanso-factures-${dateInput(new Date())}`, [
    tableSheet({
      name: 'Factures',
      title: 'Factures et recouvrement',
      subtitle: `${schoolName}${termName ? ` · ${termName}` : ''}${filterLabel ? ` · ${filterLabel}` : ''} · ${invoices.length} facture${invoices.length > 1 ? 's' : ''} · montants en ${currency}`,
      columns,
      groups,
      totals: [
        cell('Total général', 'total'),
        cell('', 'total'),
        cell('', 'total'),
        cell('', 'total'),
        cell(`${invoices.length} facture${invoices.length > 1 ? 's' : ''}`, 'total'),
        moneyCell(totalAmount),
        moneyCell(totalPaid),
        moneyCell(totalBalance),
        cell('', 'total'),
        cell('', 'total'),
      ],
    }),
  ]);
}

export async function exportFinancePaymentsWorkbook(payments, options = {}) {
  const {
    schoolName = 'Kalanso', termName = '', currency = 'FCFA', filterLabel = '',
  } = options;
  const total = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  const columns = [
    { label: 'Référence', width: 16 },
    { label: 'Élève', width: 24 },
    { label: 'Matricule', width: 13 },
    { label: 'Classe', width: 16 },
    { label: 'Facture', width: 16 },
    { label: 'Montant', width: 13 },
    { label: 'Moyen', width: 15 },
    { label: 'Date', width: 12 },
    { label: 'Statut', width: 12 },
  ];

  const groups = Object.entries(PAYMENT_METHODS).map(([method, label]) => {
    const list = payments.filter((payment) => payment.method === method);
    if (!list.length) return null;
    const subtotal = list.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    return {
      label: `${label} · ${list.length} paiement${list.length > 1 ? 's' : ''} · ${money(subtotal, currency)}`,
      rows: list.map((payment) => [
        cell(payment.reference || `PAY-${payment.id}`),
        cell(fullName(payment.student)),
        cell(payment.student?.matricule || '—'),
        cell(payment.student?.school_class?.name || '—'),
        cell(payment.invoice?.reference || 'Paiement libre'),
        moneyCell(payment.amount),
        cell(label),
        cell(date(payment.paid_on)),
        cell(PAYMENT_STATUS[payment.status]?.label || payment.status || '—'),
      ]),
      total: [
        cell('Sous-total', 'total'),
        cell('', 'total'),
        cell('', 'total'),
        cell('', 'total'),
        cell(`${list.length} paiement${list.length > 1 ? 's' : ''}`, 'total'),
        moneyCell(subtotal),
        cell('', 'total'),
        cell('', 'total'),
        cell('', 'total'),
      ],
    };
  }).filter(Boolean);

  await exportXlsx(`kalanso-paiements-${dateInput(new Date())}`, [
    tableSheet({
      name: 'Paiements',
      title: 'Paiements encaissés',
      subtitle: `${schoolName}${termName ? ` · ${termName}` : ''}${filterLabel ? ` · ${filterLabel}` : ''} · ${payments.length} paiement${payments.length > 1 ? 's' : ''} · montants en ${currency}`,
      columns,
      groups,
      totals: [
        cell('Total général', 'total'),
        cell('', 'total'),
        cell('', 'total'),
        cell('', 'total'),
        cell(`${payments.length} paiement${payments.length > 1 ? 's' : ''}`, 'total'),
        moneyCell(total),
        cell('', 'total'),
        cell('', 'total'),
        cell('', 'total'),
      ],
    }),
  ]);
}

/* ---------- personnel ---------- */

export async function exportStaffWorkbook(staff, options = {}) {
  const { schoolName = 'Kalanso', termName = '' } = options;
  const collatorName = new Intl.Collator('fr', { sensitivity: 'base', numeric: true });
  const sorted = [...staff].sort((a, b) => (
    collatorName.compare(a.department?.name || '', b.department?.name || '')
    || collatorName.compare(a.last_name || '', b.last_name || '')
    || collatorName.compare(a.first_name || '', b.first_name || '')
  ));

  const byDepartment = new Map();
  sorted.forEach((member) => {
    const key = member.department?.name || 'Sans département';
    if (!byDepartment.has(key)) byDepartment.set(key, []);
    byDepartment.get(key).push(member);
  });

  const columns = [
    { label: 'Nom', width: 24 },
    { label: 'Fonction', width: 28 },
    { label: 'Département', width: 17 },
    { label: 'E-mail', width: 30 },
    { label: 'Téléphone', width: 17 },
    { label: 'Expérience', width: 11 },
    { label: 'Embauche', width: 12 },
    { label: 'Statut', width: 11 },
    { label: 'Cours', width: 9 },
    { label: 'Classes', width: 9 },
  ];

  const groups = [...byDepartment.entries()].map(([department, members]) => {
    const teachers = members.filter((member) => /professeur|enseignant/i.test(member.role || '')).length;
    return {
      label: `${department} · ${members.length} membre${members.length > 1 ? 's' : ''} · ${teachers} enseignant${teachers > 1 ? 's' : ''}`,
      rows: members.map((member) => [
        cell(fullName(member)),
        cell(member.role || '—'),
        cell(member.department?.name || '—'),
        cell(member.email || '—'),
        cell(member.phone || '—'),
        numberCell(member.years_experience),
        cell(date(member.hired_on)),
        cell(member.is_active ? 'En poste' : 'Inactif'),
        numberCell(member.class_subjects_count),
        numberCell(member.head_teacher_classes_count),
      ]),
    };
  });

  await exportXlsx(`kalanso-personnel-${dateInput(new Date())}`, [
    tableSheet({
      name: 'Personnel',
      title: 'Annuaire du personnel',
      subtitle: `${schoolName}${termName ? ` · ${termName}` : ''} · ${staff.length} membre${staff.length > 1 ? 's' : ''} · ${byDepartment.size} département${byDepartment.size > 1 ? 's' : ''}`,
      columns,
      groups,
      totals: [
        cell('Total', 'total'),
        cell(`${staff.filter((member) => /professeur|enseignant/i.test(member.role || '')).length} enseignants`, 'total'),
        cell(`${byDepartment.size} départements`, 'total'),
        cell('', 'total'),
        cell('', 'total'),
        cell('', 'total'),
        cell('', 'total'),
        cell(`${staff.filter((member) => member.is_active).length} en poste`, 'total'),
        cell('', 'total'),
        cell('', 'total'),
      ],
    }),
  ]);
}

/* ---------- matières ---------- */

export async function exportSubjectsWorkbook(subjects, options = {}) {
  const { schoolName = 'Kalanso', termName = '' } = options;
  const byDepartment = new Map();
  [...subjects]
    .sort((a, b) => String(a.department?.name || '').localeCompare(String(b.department?.name || ''), 'fr')
      || String(a.name || '').localeCompare(String(b.name || ''), 'fr'))
    .forEach((subject) => {
      const key = subject.department?.name || 'Sans département';
      if (!byDepartment.has(key)) byDepartment.set(key, []);
      byDepartment.get(key).push(subject);
    });

  const columns = [
    { label: 'Matière', width: 24 },
    { label: 'Code', width: 9 },
    { label: 'Département', width: 18 },
    { label: 'Coefficient', width: 11 },
    { label: 'Heures / semaine', width: 14 },
    { label: 'Enseignants', width: 12 },
    { label: 'Classes', width: 10 },
    { label: 'Moyenne / 20', width: 12 },
    { label: 'Statut', width: 11 },
  ];

  const totalHours = subjects.reduce((sum, subject) => sum + Number(subject.weekly_hours || 0), 0);
  const groups = [...byDepartment.entries()].map(([department, list]) => {
    const hours = list.reduce((sum, subject) => sum + Number(subject.weekly_hours || 0), 0);
    return {
      label: `${department} · ${list.length} matière${list.length > 1 ? 's' : ''} · ${number(hours)} h / semaine`,
      rows: list.map((subject) => [
        cell(subject.name),
        cell(subject.code || '—'),
        cell(subject.department?.name || '—'),
        numberCell(subject.coefficient),
        numberCell(subject.weekly_hours),
        numberCell(subject.teachers_count),
        numberCell(subject.classes_count),
        subject.average == null ? emptyCell : numberCell(subject.average),
        cell(subject.is_active ? 'Active' : 'Inactive'),
      ]),
      total: [
        cell('Sous-total', 'total'),
        cell('', 'total'),
        cell(`${list.length} matières`, 'total'),
        cell('', 'total'),
        numberCell(hours, 'money'),
        cell('', 'total'),
        cell('', 'total'),
        cell('', 'total'),
        cell('', 'total'),
      ],
    };
  });

  await exportXlsx(`kalanso-matieres-${dateInput(new Date())}`, [
    tableSheet({
      name: 'Matières',
      title: 'Catalogue des matières',
      subtitle: `${schoolName}${termName ? ` · ${termName}` : ''} · ${subjects.length} matière${subjects.length > 1 ? 's' : ''} · ${number(totalHours)} h hebdomadaires`,
      columns,
      groups,
      totals: [
        cell('Total', 'total'),
        cell('', 'total'),
        cell(`${byDepartment.size} départements`, 'total'),
        cell('', 'total'),
        numberCell(totalHours, 'money'),
        cell('', 'total'),
        cell('', 'total'),
        cell('', 'total'),
        cell('', 'total'),
      ],
    }),
  ]);
}

/* ---------- absences ---------- */

export async function exportAbsencesWorkbook(absences, options = {}) {
  const { schoolName = 'Kalanso', termName = '', filterLabel = '' } = options;
  const byClass = new Map();
  [...absences]
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    .forEach((absence) => {
      const key = absence.school_class?.name || absence.student?.school_class?.name || 'Sans classe';
      if (!byClass.has(key)) byClass.set(key, []);
      byClass.get(key).push(absence);
    });

  const columns = [
    { label: 'Date', width: 12 },
    { label: 'Élève', width: 24 },
    { label: 'Matricule', width: 13 },
    { label: 'Classe', width: 16 },
    { label: 'Créneau', width: 14 },
    { label: 'Motif', width: 20 },
    { label: 'Statut', width: 12 },
    { label: 'Justification', width: 32 },
    { label: 'Saisie par', width: 20 },
  ];

  const unjustified = absences.filter((absence) => !absence.is_justified).length;
  const groups = [...byClass.entries()].map(([className, list]) => {
    const pending = list.filter((absence) => !absence.is_justified).length;
    return {
      label: `${className} · ${list.length} absence${list.length > 1 ? 's' : ''} · ${pending} à justifier`,
      rows: list.map((absence) => [
        cell(date(absence.date)),
        cell(fullName(absence.student)),
        cell(absence.student?.matricule || '—'),
        cell(absence.school_class?.name || absence.student?.school_class?.name || '—'),
        cell(`${String(absence.starts_at || '').slice(0, 5)}–${String(absence.ends_at || '').slice(0, 5)}`),
        cell(absence.reason || 'Non précisé'),
        cell(absence.is_justified ? 'Justifiée' : 'À justifier'),
        cell(absence.justification || '—'),
        cell(fullName(absence.recorded_by) || '—'),
      ]),
    };
  });

  await exportXlsx(`kalanso-absences-${dateInput(new Date())}`, [
    tableSheet({
      name: 'Absences',
      title: 'Suivi des absences',
      subtitle: `${schoolName}${termName ? ` · ${termName}` : ''}${filterLabel ? ` · ${filterLabel}` : ''} · ${absences.length} absence${absences.length > 1 ? 's' : ''} · ${unjustified} à justifier`,
      columns,
      groups,
      totals: [
        cell('Total', 'total'),
        cell(`${absences.length} absences`, 'total'),
        cell('', 'total'),
        cell(`${byClass.size} classes`, 'total'),
        cell('', 'total'),
        cell('', 'total'),
        cell(`${unjustified} à justifier`, 'total'),
        cell('', 'total'),
        cell('', 'total'),
      ],
    }),
  ]);
}

/* ---------- admissions ---------- */

export async function exportAdmissionsWorkbook(admissions, options = {}) {
  const { schoolName = 'Kalanso', termName = '', filterLabel = '' } = options;
  const order = ['nouveau', 'entretien', 'valide', 'inscrit', 'refuse'];
  const columns = [
    { label: 'Référence', width: 15 },
    { label: 'Candidat', width: 24 },
    { label: 'Sexe', width: 9 },
    { label: 'Naissance', width: 12 },
    { label: 'Classe demandée', width: 17 },
    { label: 'Responsable', width: 23 },
    { label: 'Téléphone', width: 17 },
    { label: 'E-mail', width: 29 },
    { label: 'Statut', width: 12 },
    { label: 'Candidature', width: 12 },
    { label: 'Décision', width: 12 },
    { label: 'Notes', width: 36 },
  ];

  const groups = order.map((status) => {
    const list = admissions.filter((admission) => admission.status === status);
    if (!list.length) return null;
    const entry = ADMISSION_STATUS[status] || { label: status };
    return {
      label: `${entry.label} · ${list.length} dossier${list.length > 1 ? 's' : ''}`,
      rows: list.map((admission) => [
        cell(admission.reference),
        cell(fullName(admission)),
        cell(admission.gender === 'F' ? 'Féminin' : admission.gender === 'M' ? 'Masculin' : '—'),
        cell(date(admission.birth_date)),
        cell(admission.desired_class?.name || '—'),
        cell(admission.guardian_name || '—'),
        cell(admission.guardian_phone || '—'),
        cell(admission.guardian_email || '—'),
        cell(entry.label),
        cell(date(admission.applied_on)),
        cell(admission.decision_on ? date(admission.decision_on) : '—'),
        cell(admission.notes || '—'),
      ]),
    };
  }).filter(Boolean);

  const enrolled = admissions.filter((admission) => admission.status === 'inscrit').length;
  const waiting = admissions.filter((admission) => ['nouveau', 'entretien', 'valide'].includes(admission.status)).length;

  await exportXlsx(`kalanso-admissions-${dateInput(new Date())}`, [
    tableSheet({
      name: 'Admissions',
      title: 'Dossiers de candidature',
      subtitle: `${schoolName}${termName ? ` · ${termName}` : ''}${filterLabel ? ` · ${filterLabel}` : ''} · ${admissions.length} dossier${admissions.length > 1 ? 's' : ''} · ${enrolled} inscrit${enrolled > 1 ? 's' : ''} · ${waiting} en étude`,
      columns,
      groups,
      totals: [
        cell('Total', 'total'),
        cell(`${admissions.length} dossiers`, 'total'),
        cell('', 'total'),
        cell('', 'total'),
        cell('', 'total'),
        cell('', 'total'),
        cell('', 'total'),
        cell('', 'total'),
        cell(`${enrolled} inscrits`, 'total'),
        cell('', 'total'),
        cell('', 'total'),
        cell(`${waiting} en étude`, 'total'),
      ],
    }),
  ]);
}

/* ---------- fiches individuelles ---------- */

export async function exportStaffProfileWorkbook(member, options = {}) {
  const {
    schoolName = 'Kalanso', termName = '', yearName = '',
  } = options;
  const classSubjects = member?.class_subjects || [];
  const slots = member?.timetable_slots || [];
  const headClasses = member?.head_teacher_classes || [];
  const weeklyHours = slots.reduce((sum, slot) => {
    const [sh, sm] = String(slot.starts_at || '0:0').split(':').map(Number);
    const [eh, em] = String(slot.ends_at || '0:0').split(':').map(Number);
    return sum + Math.max(0, (eh * 60 + em) - (sh * 60 + sm)) / 60;
  }, 0);

  const columns = [
    { label: 'Information', width: 26 },
    { label: 'Valeur', width: 26 },
    { label: 'Détail', width: 22 },
    { label: 'Complément', width: 20 },
    { label: 'Heures', width: 12 },
    { label: 'Salle', width: 12 },
  ];

  const groups = [
    {
      label: `Identité et contrat · ${member?.role || 'Membre du personnel'}`,
      headers: ['Information', 'Valeur'],
      rows: [
        [cell('Nom complet'), cell(fullName(member))],
        [cell('Fonction'), cell(member?.role || '—')],
        [cell('Département'), cell(member?.department?.name || '—')],
        [cell('E-mail'), cell(member?.email || '—')],
        [cell('Téléphone'), cell(member?.phone || '—')],
        [cell('Date d’embauche'), cell(date(member?.hired_on))],
        [cell('Expérience'), cell(`${member?.years_experience || 0} an${(member?.years_experience || 0) > 1 ? 's' : ''}`)],
        [cell('Statut'), cell(member?.is_active ? 'En poste' : 'Inactif')],
        [cell('Volume hebdomadaire'), cell(`${number(weeklyHours, 1)} h / semaine`)],
        [cell('Classes suivies'), cell(`${new Set(classSubjects.map((item) => item.school_class_id)).size} classe(s)`)],
      ],
    },
  ];

  if (classSubjects.length) {
    groups.push({
      label: `Cours affectés · ${classSubjects.length} affectation${classSubjects.length > 1 ? 's' : ''}`,
      headers: ['Classe', 'Niveau', 'Matière', 'Code', 'Heures / semaine', 'Salle'],
      rows: classSubjects.map((item) => {
        const hours = slots
          .filter((slot) => Number(slot.school_class_id) === Number(item.school_class_id)
            && Number(slot.subject_id) === Number(item.subject_id))
          .reduce((sum, slot) => {
            const [sh, sm] = String(slot.starts_at || '0:0').split(':').map(Number);
            const [eh, em] = String(slot.ends_at || '0:0').split(':').map(Number);
            return sum + Math.max(0, (eh * 60 + em) - (sh * 60 + sm)) / 60;
          }, 0);
        return [
          cell(item.school_class?.name || '—'),
          cell(item.school_class?.level || '—'),
          cell(item.subject?.name || '—'),
          cell(item.subject?.code || '—'),
          numberCell(hours),
          cell(item.school_class?.room || '—'),
        ];
      }),
    });
  }

  if (slots.length) {
    groups.push({
      label: `Emploi du temps · ${slots.length} cours / semaine`,
      headers: ['Jour', 'Horaire', 'Classe', 'Matière', 'Heures', 'Salle'],
      rows: [...slots]
        .sort((a, b) => Number(a.day_of_week || 1) - Number(b.day_of_week || 1)
          || String(a.starts_at || '').localeCompare(String(b.starts_at || '')))
        .map((slot) => [
          cell(DAYS[Number(slot.day_of_week || 1) - 1] || '—'),
          cell(`${String(slot.starts_at || '').slice(0, 5)}–${String(slot.ends_at || '').slice(0, 5)}`),
          cell(slot.school_class?.name || '—'),
          cell(slot.subject?.name || '—'),
          numberCell(((Number(String(slot.ends_at || '').slice(0, 2)) * 60 + Number(String(slot.ends_at || '').slice(3, 5)))
            - (Number(String(slot.starts_at || '').slice(0, 2)) * 60 + Number(String(slot.starts_at || '').slice(3, 5)))) / 60),
          cell(slot.room || slot.school_class?.room || '—'),
        ]),
    });
  }

  if (headClasses.length) {
    groups.push({
      label: 'Classes principales',
      headers: ['Classe', 'Niveau', 'Salle'],
      rows: headClasses.map((item) => [
        cell(item.name),
        cell(item.level || '—'),
        cell(item.room || '—'),
      ]),
    });
  }

  await exportXlsx(`kalanso-personnel-${filesafe(fullName(member))}`, [
    tableSheet({
      name: 'Fiche personnel',
      title: `Fiche personnel · ${fullName(member)}`,
      subtitle: `${schoolName}${yearName ? ` · ${yearName}` : ''}${termName ? ` · ${termName}` : ''} · ${member?.role || ''} · ${member?.department?.name || 'sans département'}`,
      columns,
      groups,
    }),
  ]);
}

export async function exportAdmissionWorkbook(admission, options = {}) {
  const {
    schoolName = 'Kalanso', termName = '', yearName = '',
  } = options;
  const columns = [
    { label: 'Information', width: 28 },
    { label: 'Valeur', width: 30 },
    { label: 'Détail', width: 24 },
    { label: 'Complément', width: 22 },
    { label: 'Date', width: 14 },
    { label: 'Statut', width: 14 },
  ];
  const status = ADMISSION_STATUS[admission?.status] || { label: admission?.status || '—' };

  await exportXlsx(`kalanso-admission-${filesafe(admission?.reference || fullName(admission))}`, [
    tableSheet({
      name: 'Dossier admission',
      title: `Dossier de candidature · ${fullName(admission)}`,
      subtitle: `${schoolName}${yearName ? ` · ${yearName}` : ''}${termName ? ` · ${termName}` : ''} · ${admission?.reference || ''} · ${status.label}`,
      columns,
      groups: [
        {
          label: 'Candidat',
          headers: ['Information', 'Valeur'],
          rows: [
            [cell('Nom complet'), cell(fullName(admission))],
            [cell('Référence'), cell(admission?.reference || '—')],
            [cell('Sexe'), cell(admission?.gender === 'F' ? 'Féminin' : admission?.gender === 'M' ? 'Masculin' : '—')],
            [cell('Date de naissance'), cell(date(admission?.birth_date))],
            [cell('Classe demandée'), cell(admission?.desired_class?.name || '—')],
            [cell('Niveau'), cell(admission?.desired_class?.level || '—')],
            [cell('Salle prévue'), cell(admission?.desired_class?.room || '—')],
          ],
        },
        {
          label: 'Responsable légal',
          headers: ['Information', 'Valeur'],
          rows: [
            [cell('Nom'), cell(admission?.guardian_name || '—')],
            [cell('Téléphone'), cell(admission?.guardian_phone || '—')],
            [cell('E-mail'), cell(admission?.guardian_email || '—')],
          ],
        },
        {
          label: 'Suivi du dossier',
          headers: ['Information', 'Valeur'],
          rows: [
            [cell('Statut'), cell(status.label)],
            [cell('Candidature'), cell(date(admission?.applied_on))],
            [cell('Décision'), cell(admission?.decision_on ? date(admission.decision_on) : 'En attente')],
            [cell('Notes internes'), cell(admission?.notes || '—')],
          ],
        },
      ],
    }),
  ]);
}

/* ---------- bulletin scolaire ---------- */

const evaluationScore = (subject, key) => {
  const grade = (subject?.grades || []).find((entry) => entry.evaluation === key);
  return grade ? Number(grade.score) : null;
};

export async function exportStudentReportWorkbook(student, report, options = {}) {
  const {
    schoolName = 'Kalanso', yearName = '', termName = '', absences = null,
  } = options;
  const subjects = report?.subjects || [];
  const term = report?.term?.name || termName;
  const average = report?.general_average;
  const mention = report?.mention || '';
  const width = 8;
  const columns = [30, 8, 8, 10, 10, 12, 10, 10];

  const rows = titleRows(
    'Bulletin scolaire',
    `${schoolName}${yearName ? ` · ${yearName}` : ''} · ${term || 'Période en cours'} · ${student?.school_class?.name || 'Sans classe'}`,
    width,
  );
  const merges = [
    range('A', 'H', 1),
    range('A', 'H', 2),
  ];

  const infoRow = (leftLabel, leftValue, rightLabel, rightValue) => {
    const rowNumber = rows.length + 1;
    merges.push(`B${rowNumber}:D${rowNumber}`, `F${rowNumber}:H${rowNumber}`);
    return {
      height: 21,
      cells: [
        { v: leftLabel, s: 'muted' },
        { v: leftValue, s: 'cell' },
        { v: '', s: 'cell' },
        { v: '', s: 'cell' },
        { v: rightLabel, s: 'muted' },
        { v: rightValue, s: 'cell' },
        { v: '', s: 'cell' },
        { v: '', s: 'cell' },
      ],
    };
  };

  rows.push({
    height: 22,
    cells: [{ v: `Élève · ${fullName(student)}`, s: 'section' }, ...Array.from({ length: width - 1 }, () => ({ v: '', s: 'section' }))],
  });
  merges.push(range('A', 'H', rows.length));

  rows.push(infoRow('Élève', fullName(student), 'Matricule', student?.matricule || '—'));
  rows.push(infoRow('Classe', student?.school_class?.name || '—', 'Niveau', student?.school_class?.level || '—'));
  rows.push(infoRow('Naissance', date(student?.birth_date), 'Sexe', student?.gender === 'F' ? 'Féminin' : student?.gender === 'M' ? 'Masculin' : '—'));
  rows.push(infoRow('Tuteur', student?.guardian_name || '—', 'Téléphone', student?.guardian_phone || '—'));
  rows.push(infoRow('Période', term || '—', 'Année scolaire', yearName || '—'));
  rows.push(infoRow('Effectif', report?.class_size != null ? `${report.class_size} élèves` : '—', 'Rang', report?.rank != null ? `${report.rank}${report.class_size ? ` / ${report.class_size}` : ''}` : '—'));
  rows.push(infoRow('Moyenne générale', average != null ? `${number(average, 2)} / 20` : '—', 'Mention', mention || '—'));
  if (absences) {
    rows.push(infoRow(
      'Absences',
      `${number(absences.total || 0)} au total`,
      'À justifier',
      number(absences.unjustified || 0),
    ));
  }

  rows.push({ height: 10, cells: [] });
  rows.push({
    height: 30,
    cells: ['Matière', 'Code', 'Coef.', 'Devoir 1', 'Devoir 2', 'Composition', 'Moyenne', 'Points'].map((label) => ({ v: label, s: 'header' })),
  });

  let totalCoefficients = 0;
  let totalPoints = 0;
  subjects.forEach((subject) => {
    const coefficient = Number(subject.coefficient || 0);
    const subjectAverage = subject.average == null ? null : Number(subject.average);
    totalCoefficients += coefficient;
    if (subjectAverage != null) totalPoints += subjectAverage * coefficient;
    rows.push({
      height: 20,
      cells: [
        { v: subject.subject || '—', s: 'cell' },
        { v: subject.code || '—', s: 'cell' },
        { v: coefficient, s: 'number' },
        { v: evaluationScore(subject, 'devoir_1') ?? '', s: evaluationScore(subject, 'devoir_1') == null ? 'empty' : 'number' },
        { v: evaluationScore(subject, 'devoir_2') ?? '', s: evaluationScore(subject, 'devoir_2') == null ? 'empty' : 'number' },
        { v: evaluationScore(subject, 'composition') ?? '', s: evaluationScore(subject, 'composition') == null ? 'empty' : 'number' },
        { v: subjectAverage ?? '', s: subjectAverage == null ? 'empty' : 'average' },
        { v: subjectAverage == null ? '' : round2(subjectAverage * coefficient), s: subjectAverage == null ? 'empty' : 'number' },
      ],
    });
  });

  if (!subjects.length) {
    rows.push({
      height: 24,
      cells: [{ v: 'Aucune note enregistrée pour cette période.', s: 'cell' }, ...Array.from({ length: width - 1 }, () => ({ v: '', s: 'empty' }))],
    });
  }

  rows.push({
    height: 24,
    cells: [
      { v: 'Total', s: 'total' },
      { v: '', s: 'total' },
      { v: totalCoefficients, s: 'total' },
      { v: '', s: 'total' },
      { v: '', s: 'total' },
      { v: '', s: 'total' },
      { v: average == null ? '' : round2(average), s: 'total' },
      { v: round2(totalPoints), s: 'total' },
    ],
  });

  rows.push({ height: 10, cells: [] });
  rows.push({
    height: 24,
    cells: [
      { v: `Moyenne générale : ${average != null ? `${number(average, 2)} / 20` : '—'}`, s: 'total' },
      { v: '', s: 'total' },
      { v: '', s: 'total' },
      { v: '', s: 'total' },
      { v: '', s: 'total' },
      { v: '', s: 'total' },
      { v: '', s: 'total' },
      { v: `Mention : ${mention || '—'}`, s: 'total' },
    ],
  });
  rows.push({
    height: 20,
    cells: [
      { v: `Bulletin généré le ${generatedLabel()}`, s: 'muted' },
      ...Array.from({ length: width - 1 }, () => ({ v: '', s: 'muted' })),
    ],
  });
  merges.push(range('A', 'H', rows.length));

  const sheets = [{
    name: 'Bulletin',
    columns,
    rows,
    merges,
    freeze: 0,
    orientation: 'portrait',
  }];

  if (subjects.length) {
    const detailRows = titleRows(
      'Détail des évaluations',
      `${fullName(student)} · ${term || 'période en cours'} · ${subjects.length} matière${subjects.length > 1 ? 's' : ''}`,
      7,
    );
    const detailMerges = [range('A', 'G', 1), range('A', 'G', 2)];
    detailRows.push({
      height: 30,
      cells: ['Matière', 'Code', 'Évaluation', 'Date', 'Note', 'Barème', 'Coefficient'].map((label) => ({ v: label, s: 'header' })),
    });
    subjects.forEach((subject) => {
      (subject.grades || []).forEach((grade) => {
        detailRows.push({
          height: 20,
          cells: [
            { v: subject.subject || '—', s: 'cell' },
            { v: subject.code || '—', s: 'cell' },
            { v: EVALUATIONS[grade.evaluation] || grade.evaluation || '—', s: 'cell' },
            { v: date(grade.evaluated_on), s: 'cell' },
            { v: Number(grade.score), s: 'number' },
            { v: Number(grade.max_score || 20), s: 'number' },
            { v: Number(subject.coefficient || 0), s: 'number' },
          ],
        });
      });
    });
    sheets.push({
      name: 'Détail des notes',
      columns: [26, 9, 16, 13, 10, 10, 12],
      rows: detailRows,
      merges: detailMerges,
      freeze: 3,
      orientation: 'portrait',
    });
  }

  await exportXlsx(`kalanso-bulletin-${student?.matricule || 'eleve'}`, sheets);
}

export { filesafe };
