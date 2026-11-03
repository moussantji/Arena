/* ============================================================
   Kalanso — repères de semaine
   Fonctions pures partagées par l'emploi du temps, la fiche
   classe et les exports Excel.
   ============================================================ */

export const dayIndex = (value = new Date()) => (value.getDay() === 0 ? 7 : value.getDay());

const atNoon = (value) => {
  const date = new Date(value);
  date.setHours(12, 0, 0, 0);
  return date;
};

export const addDays = (value, count) => {
  const date = atNoon(value);
  date.setDate(date.getDate() + count);
  return date;
};

export const startOfWeek = (value = new Date(), offset = 0) => {
  const date = atNoon(value);
  date.setDate(date.getDate() - (dayIndex(date) - 1) + offset * 7);
  return date;
};

/* Semaine scolaire affichée par défaut : la semaine en cours,
   ou la semaine à venir le samedi et le dimanche. */
export const schoolWeekStart = (value = new Date()) => (
  startOfWeek(value, dayIndex(value) >= 6 ? 1 : 0)
);

export const sameWeek = (first, second) => {
  const a = startOfWeek(first);
  const b = startOfWeek(second);
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
};

const monthYear = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });
const monthDay = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' });
const dayNumber = new Intl.DateTimeFormat('fr-FR', { day: '2-digit' });

/* « du 2 au 6 novembre 2026 », « du 30 octobre au 3 novembre 2026 » */
export const weekRangeLabel = (weekStart) => {
  const start = atNoon(weekStart || new Date());
  const end = addDays(start, 4);
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `du ${start.getDate()} au ${end.getDate()} ${monthYear.format(end)}`;
  }
  return `du ${monthDay.format(start)} au ${monthDay.format(end)} ${end.getFullYear()}`;
};

/* Numéro du jour dans la semaine affichée : 02, 03, … */
export const weekDayNumber = (weekStart, day) => (
  weekStart ? dayNumber.format(addDays(weekStart, Number(day || 1) - 1)) : ''
);
