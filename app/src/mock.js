/* ============================================================
   DIALLO — Indigo Minuit · design tokens
   Affichage uniquement : aucune logique métier.
   ============================================================ */

export const theme = {
  bg: '#070B1F',
  bg2: '#0B1030',
  panel: 'rgba(27,42,107,.28)',
  panel2: 'rgba(27,42,107,.42)',
  glass: 'rgba(167,182,255,.10)',
  ink: '#F0F2FF',
  dim: '#A7B6FF',
  faint: '#6B78A8',
  line: 'rgba(167,182,255,.15)',
  lineStrong: 'rgba(167,182,255,.28)',
  accent: '#5B7CFA',
  accent2: '#7E9BFF',
  copper: '#E0A86F',
};

/* Données d'affichage — statiques, volontairement sans logique. */

export const school = {
  name: 'DIALLO',
  full: 'École Internationale Diallo',
  user: { name: 'M. Diallo', role: 'Direction', initials: 'MD' },
  year: '2025 — 2026',
  term: 'Semestre 1',
};

export const kpis = [
  { key: 'students', label: 'Élèves', value: '1 284', delta: '+2,4 %', hint: 'vs septembre', tone: 'up' },
  { key: 'attendance', label: 'Présence', value: '96,8 %', progress: 96.8, hint: 'moyenne 30 jours' },
  { key: 'recovery', label: 'Recouvrement', value: '8,45 M', unit: 'FCFA', spark: [18, 24, 21, 33, 30, 44, 41, 52, 49, 63, 61, 74], hint: 'exercice 2026' },
  { key: 'classes', label: 'Classes', value: '42', hint: 'dont 6 terminales', dot: true },
];

export const recoverySeries = [
  { m: 'Jan', v: 26 }, { m: 'Fév', v: 31 }, { m: 'Mar', v: 28 }, { m: 'Avr', v: 37 },
  { m: 'Mai', v: 44 }, { m: 'Juin', v: 41 }, { m: 'Juil', v: 39 }, { m: 'Août', v: 52 },
  { m: 'Sep', v: 49 }, { m: 'Oct', v: 63 }, { m: 'Nov', v: 58 }, { m: 'Déc', v: 72 },
];

export const classDistribution = [
  { label: 'Terminale', v: 92 }, { label: 'Première', v: 74 }, { label: 'Seconde', v: 61 },
  { label: 'Troisième', v: 55 }, { label: 'Quatrième', v: 48 }, { label: 'Cinquième', v: 44 },
];

export const today = [
  { time: '08:00', subject: 'Mathématiques', room: 'Salle 204', who: 'AM', tone: 'accent' },
  { time: '10:00', subject: 'Physique-Chimie', room: 'Labo A', who: 'CD', tone: 'glass' },
  { time: '14:00', subject: 'Français', room: 'Salle 112', who: 'PT', tone: 'copper' },
];

export const students = [
  { name: 'Aminata Traoré', ref: '2026-0142', cls: 'Terminale S', status: 'À jour', avg: '12,80', balance: '8,45 M FCFA', who: 'AT' },
  { name: 'Ibrahim Konaté', ref: '2026-0143', cls: 'Terminale S', status: 'En retard', avg: '11,20', balance: '47 000 FCFA', who: 'IK' },
  { name: 'Fatoumata Diallo', ref: '2026-0151', cls: 'Première S', status: 'À jour', avg: '14,60', balance: '0 FCFA', who: 'FD' },
  { name: 'Moussa Camara', ref: '2026-0164', cls: 'Seconde A', status: 'Boursier', avg: '13,10', balance: '0 FCFA', who: 'MC' },
  { name: 'Awa Sow', ref: '2026-0177', cls: 'Terminale L', status: 'À jour', avg: '15,40', balance: '120 000 FCFA', who: 'AS' },
  { name: 'Seydou Keïta', ref: '2026-0188', cls: 'Première ES', status: 'En retard', avg: '9,80', balance: '30 000 FCFA', who: 'SK' },
];

export const classes = [
  { name: 'Terminale S', effectif: 32, cap: 35, teacher: 'M. Martior', active: true },
  { name: 'Terminale L', effectif: 30, cap: 35, teacher: 'Mme Diallo' },
  { name: 'Première S', effectif: 34, cap: 36, teacher: 'M. Hilorma' },
  { name: 'Première ES', effectif: 29, cap: 34, teacher: 'Mme Traoré' },
  { name: 'Seconde A', effectif: 33, cap: 36, teacher: 'M. Framiéma' },
  { name: 'Seconde B', effectif: 28, cap: 34, teacher: 'Mme Rifa' },
];

export const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
export const hours = ['08:00', '10:00', '12:00', '14:00', '16:00'];

export const timetable = [
  /* lundi */
  { d: 0, h: 0, subject: 'Mathématiques', room: 'S204', tone: 'a' },
  { d: 0, h: 1, subject: 'Physique', room: 'Labo A', tone: 'b' },
  { d: 0, h: 3, subject: 'Français', room: 'S112', tone: 'c' },
  /* mardi */
  { d: 1, h: 0, subject: 'Histoire', room: 'S101', tone: 'b' },
  { d: 1, h: 1, subject: 'Anglais', room: 'S303', tone: 'a' },
  { d: 1, h: 2, subject: 'SVT', room: 'Labo B', tone: 'c' },
  /* mercredi */
  { d: 2, h: 0, subject: 'Mathématiques', room: 'S204', tone: 'a' },
  { d: 2, h: 3, subject: 'EPS', room: 'Gymnase', tone: 'c' },
  /* jeudi — colonne du jour */
  { d: 3, h: 0, subject: 'Philosophie', room: 'S205', tone: 'b' },
  { d: 3, h: 1, subject: 'Mathématiques', room: 'S204', tone: 'a', live: true },
  { d: 3, h: 2, subject: 'Anglais', room: 'S303', tone: 'c' },
  { d: 3, h: 3, subject: 'Physique', room: 'Labo A', tone: 'b' },
  /* vendredi */
  { d: 4, h: 0, subject: 'Français', room: 'S112', tone: 'c' },
  { d: 4, h: 2, subject: 'Informatique', room: 'Salle info', tone: 'a' },
  { d: 4, h: 4, subject: 'Conseil de classe', room: 'Bureau 10', tone: 'b' },
];

export const payments = [
  { who: 'Aminata Traoré', ref: 'Frais de scolarité', date: '28/02/2026', amount: '8,45 M FCFA', status: 'Payé' },
  { who: 'Ibrahim Konaté', ref: 'Cantine', date: '20/02/2026', amount: '47 000 FCFA', status: 'En attente' },
  { who: 'Fatoumata Diallo', ref: 'Transport', date: '23/02/2026', amount: '20 000 FCFA', status: 'Payé' },
  { who: 'Moussa Camara', ref: 'Frais de scolarité', date: '23/02/2026', amount: '30 100 FCFA', status: 'Payé' },
  { who: 'Awa Sow', ref: 'Cantine', date: '23/02/2026', amount: '10 000 FCFA', status: 'En attente' },
];

export const staff = [
  { name: 'Moussa Martior', role: 'Professeur de mathématiques', tags: ['Maths', '12 ans'], who: 'MM' },
  { name: 'Jean Cissé', role: 'Censeur', tags: ['Direction', '8 ans'], who: 'JC' },
  { name: 'Aminata Barry', role: 'Comptable', tags: ['Finances', '5 ans'], who: 'AB' },
  { name: 'Oumar Sy', role: 'Surveillant général', tags: ['Vie scolaire', '3 ans'], who: 'OS' },
  { name: 'Nafissatou Bâ', role: 'Documentaliste', tags: ['CDI', '6 ans'], who: 'NB' },
  { name: 'Kadidia Sow', role: "Professeur d'anglais", tags: ['Anglais', '9 ans'], who: 'KS' },
];

export const grades = [
  { who: 'Aminata Traoré', d1: 16, d2: 14.5, comp: 15, avg: '15,20', tag: 'Excellent' },
  { who: 'Ibrahim Konaté', d1: 11, d2: 9.5, comp: 12, avg: '10,85', tag: 'Passable' },
  { who: 'Fatoumata Diallo', d1: 18, d2: 17, comp: 16.5, avg: '17,15', tag: 'Excellent' },
  { who: 'Moussa Camara', d1: 13, d2: 12, comp: 11.5, avg: '12,15', tag: 'Bien' },
  { who: 'Awa Sow', d1: 9, d2: 8, comp: 7.5, avg: '8,15', tag: 'Insuffisant' },
  { who: 'Seydou Keïta', d1: 12, d2: 13.5, comp: 12, avg: '12,50', tag: 'Bien' },
];

export const absences = [
  { who: 'Aminata Traoré', cls: 'Terminale S', date: '23.05.2026', justified: false },
  { who: 'Ibrahim Konaté', cls: 'Terminale S', date: '26.05.2026', justified: true },
  { who: 'Fatoumata Diallo', cls: 'Première S', date: '17.03.2026', justified: true },
  { who: 'Moussa Camara', cls: 'Seconde A', date: '15.02.2026', justified: false },
  { who: 'Awa Sow', cls: 'Terminale L', date: '28.02.2026', justified: true },
];

export const motivations = [
  { label: 'Maladie', v: 78 },
  { label: 'Transport', v: 46 },
  { label: 'Familial', v: 31 },
  { label: 'Non justifié', v: 18 },
];

export const threads = [
  { who: 'Mme Traoré', sub: 'Parent de Aminata · Terminale S', preview: 'Le justificatif du 23 est bien reçu, merci.', time: '09:42', unread: true, active: true },
  { who: 'M. Konaté', sub: 'Parent de Ibrahim · Terminale S', preview: 'Concernant le solde de la scolarité…', time: '09:18', unread: true },
  { who: 'Vie scolaire', sub: 'Canal interne · 6 membres', preview: 'Rappel : conseil de classe vendredi.', time: 'Hier' },
  { who: 'Mme Sow', sub: 'Parent de Awa · Terminale L', preview: 'Merci pour le bulletin du trimestre.', time: 'Lun' },
  { who: 'Service financier', sub: 'Canal interne · 3 membres', preview: 'Les reçus de février sont émis.', time: 'Lun' },
];

export const messages = [
  { side: 'in', text: 'Bonjour Monsieur, je voulais vérifier la présence d’Aminata du 23 octobre.', time: '09:31' },
  { side: 'out', text: 'Bonjour Madame. L’absence est enregistrée à 08:00, justificatif bien transmis ce matin.', time: '09:34' },
  { side: 'in', text: 'Parfait, merci. Le solde de la scolarité est-il à jour ?', time: '09:38' },
  { side: 'out', text: 'Oui, les frais de scolarité sont réglés. Le reçu de février est disponible dans l’espace parents.', time: '09:41' },
];

export const documents = [
  { name: 'Bulletin trimestre 1', meta: 'PDF · 240 Ko' },
  { name: 'Certificat de scolarité', meta: 'PDF · 120 Ko' },
  { name: 'Attestation de paiement', meta: 'PDF · 96 Ko' },
];

export const studentProfile = {
  name: 'Aminata Traoré',
  ref: 'Terminale S · Matricule 2026-0142',
  chips: ['Boursière', 'Interne', 'À jour'],
  info: [
    ['Date de naissance', '12/03/2009'],
    ['Tuteur', 'Mme Traoré'],
    ['Téléphone', '+223 76 00 00 00'],
    ['Adresse', 'Hamdallaye ACI 2000, Bamako'],
    ['E-mail', 'a.traore@famille.ml'],
  ],
  attendance: 96.8,
  strip: Array.from({ length: 30 }, (_, i) => (i === 7 || i === 18 || i === 26 ? 'abs' : 'ok')),
  notes: [
    ['Mathématiques', 15.5], ['Physique-Chimie', 13.0], ['Français', 16.0],
    ['Anglais', 14.5], ['Histoire-Géo', 12.5],
  ],
};

export const admissions = [
  { col: 'Nouveau', v: 34, cards: [
    { who: 'Aminata Cissé', ref: 'REF-2026-042', cls: 'Terminale S' },
    { who: 'Ibrahim Traoré', ref: 'REF-2026-043', cls: 'Première S' },
    { who: 'Fatou Diallo', ref: 'REF-2026-044', cls: 'Seconde A' },
  ]},
  { col: 'Entretien', v: 41, cards: [
    { who: 'Moussa Bâ', ref: 'REF-2026-031', cls: 'Terminale L' },
    { who: 'Awa Konaté', ref: 'REF-2026-032', cls: 'Première ES' },
    { who: 'Seydou Sow', ref: 'REF-2026-033', cls: 'Seconde B' },
  ]},
  { col: 'Validé', v: 41, cards: [
    { who: 'Nafissatou Sy', ref: 'REF-2026-018', cls: 'Terminale S' },
    { who: 'Oumar Barry', ref: 'REF-2026-019', cls: 'Première S' },
    { who: 'Kadidia Camara', ref: 'REF-2026-020', cls: 'Seconde A' },
  ]},
  { col: 'Inscrit', v: 12, cards: [
    { who: 'Mariam Traoré', ref: 'REF-2026-004', cls: 'Terminale L' },
    { who: 'Jean Cissé', ref: 'REF-2026-005', cls: 'Première ES' },
    { who: 'Aminata Sow', ref: 'REF-2026-006', cls: 'Seconde B' },
  ]},
];

export const notifications = [
  { title: 'Nouvelle inscription', body: 'Aminata Cissé · Terminale S', time: 'il y a 4 min' },
  { title: 'Paiement reçu', body: '8,45 M FCFA · Frais de scolarité', time: 'il y a 22 min' },
  { title: 'Absence non justifiée', body: 'Moussa Camara · Seconde A', time: 'il y a 1 h' },
];
