import { Dashboard } from './pages/dashboard.jsx';
import { Eleves } from './pages/students.jsx';
import { Classes } from './pages/classes.jsx';
import { EmploiDuTemps } from './pages/timetable.jsx';
import { Finances } from './pages/finance.jsx';
import { Personnel } from './pages/staff.jsx';
import { Matieres } from './pages/subjects.jsx';
import { Notes } from './pages/grades.jsx';
import { Absences } from './pages/absences.jsx';
import { Fiche } from './pages/student-profile.jsx';
import { Admissions } from './pages/admissions.jsx';
import { Messagerie } from './pages/messages.jsx';
import { Parametres } from './pages/settings.jsx';
import { Modales } from './modals-page.jsx';

export { META } from './pages/meta.js';

export {
  Dashboard,
  Eleves,
  Classes,
  EmploiDuTemps,
  Finances,
  Personnel,
  Matieres,
  Notes,
  Absences,
  Fiche,
  Admissions,
  Messagerie,
  Parametres,
  Modales,
};

export const PAGES = {
  dashboard: Dashboard,
  eleves: Eleves,
  classes: Classes,
  'emploi-du-temps': EmploiDuTemps,
  finances: Finances,
  personnel: Personnel,
  matieres: Matieres,
  notes: Notes,
  absences: Absences,
  fiche: Fiche,
  admissions: Admissions,
  messagerie: Messagerie,
  parametres: Parametres,
  modales: Modales,
};
