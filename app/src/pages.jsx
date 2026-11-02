import { Dashboard } from './pages/dashboard.jsx';
import { Eleves } from './pages/students.jsx';
import { Classes } from './pages/classes.jsx';
import { FicheClasse } from './pages/class-profile.jsx';
import { EmploiDuTemps } from './pages/timetable.jsx';
import { Finances } from './pages/finance.jsx';
import { Personnel } from './pages/staff.jsx';
import { FichePersonnel } from './pages/staff-profile.jsx';
import { Matieres } from './pages/subjects.jsx';
import { Notes } from './pages/grades.jsx';
import { Absences } from './pages/absences.jsx';
import { Fiche } from './pages/student-profile.jsx';
import { Admissions } from './pages/admissions.jsx';
import { FicheAdmission } from './pages/admission-profile.jsx';
import { Messagerie } from './pages/messages.jsx';
import { Parametres } from './pages/settings.jsx';
import { Modales } from './modals-page.jsx';

export { META } from './pages/meta.js';

export {
  Dashboard,
  Eleves,
  Classes,
  FicheClasse,
  EmploiDuTemps,
  Finances,
  Personnel,
  FichePersonnel,
  Matieres,
  Notes,
  Absences,
  Fiche,
  Admissions,
  FicheAdmission,
  Messagerie,
  Parametres,
  Modales,
};

export const PAGES = {
  dashboard: Dashboard,
  eleves: Eleves,
  classes: Classes,
  classe: FicheClasse,
  'emploi-du-temps': EmploiDuTemps,
  finances: Finances,
  personnel: Personnel,
  'fiche-personnel': FichePersonnel,
  matieres: Matieres,
  notes: Notes,
  absences: Absences,
  fiche: Fiche,
  admissions: Admissions,
  'fiche-admission': FicheAdmission,
  messagerie: Messagerie,
  parametres: Parametres,
  modales: Modales,
};
