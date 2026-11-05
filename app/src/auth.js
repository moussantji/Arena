/* ============================================================
   Kalanso — authentification et rôles
   ============================================================ */


export const ROLE_DIRECTION = 'direction';
export const ROLE_SECRETARIAT = 'secretariat';
export const ROLE_COMPTABLE = 'comptable';
export const ROLE_ENSEIGNANT = 'enseignant';

export const ROLES = [
  ROLE_DIRECTION,
  ROLE_SECRETARIAT,
  ROLE_COMPTABLE,
  ROLE_ENSEIGNANT,
];

export const ROLE_LABELS = {
  [ROLE_DIRECTION]: 'Direction',
  [ROLE_SECRETARIAT]: 'Secrétariat',
  [ROLE_COMPTABLE]: 'Comptabilité',
  [ROLE_ENSEIGNANT]: 'Enseignant',
};

export const ROLE_DESCRIPTIONS = {
  [ROLE_DIRECTION]: 'Accès complet à toutes les fonctionnalités',
  [ROLE_SECRETARIAT]: 'Accès aux élèves, classes, matières, personnel et admissions',
  [ROLE_COMPTABLE]: 'Accès aux finances et consultations',
  [ROLE_ENSEIGNANT]: 'Accès aux notes, absences et consultations pédagogiques',
};

export const ROLE_PERMISSIONS = {
  [ROLE_DIRECTION]: [
    'dashboard.view',
    'students.view',
    'students.manage',
    'classes.view',
    'classes.manage',
    'subjects.view',
    'subjects.manage',
    'staff.view',
    'staff.manage',
    'schedules.view',
    'schedules.manage',
    'absences.view',
    'absences.manage',
    'admissions.view',
    'admissions.manage',
    'documents.view',
    'documents.manage',
    'referentiels.view',
    'referentiels.manage',
    'finances.view',
    'finances.manage',
    'messages.view',
    'messages.manage',
    'settings.view',
    'settings.manage',
    'users.view',
    'users.manage',
    'establishment.view',
    'establishment.manage',
  ],
  [ROLE_SECRETARIAT]: [
    'dashboard.view',
    'students.view',
    'students.manage',
    'classes.view',
    'classes.manage',
    'subjects.view',
    'subjects.manage',
    'staff.view',
    'staff.manage',
    'schedules.view',
    'schedules.manage',
    'absences.view',
    'absences.manage',
    'admissions.view',
    'admissions.manage',
    'documents.view',
    'documents.manage',
    'referentiels.view',
    'referentiels.manage',
    'messages.view',
    'messages.manage',
  ],
  [ROLE_COMPTABLE]: [
    'dashboard.view',
    'students.view',
    'classes.view',
    'finances.view',
    'finances.manage',
    'messages.view',
    'messages.manage',
  ],
  [ROLE_ENSEIGNANT]: [
    'dashboard.view',
    'students.view',
    'classes.view',
    'schedules.view',
    'subjects.view',
    'grades.view',
    'grades.manage',
    'absences.view',
    'absences.manage',
    'messages.view',
    'messages.manage',
  ],
};

export const ROLE_PAGES = {
  [ROLE_DIRECTION]: [
    'dashboard',
    'eleves',
    'classes',
    'classe',
    'emploi-du-temps',
    'finances',
    'personnel',
    'fiche-personnel',
    'messagerie',
    'matieres',
    'notes',
    'absences',
    'fiche',
    'admissions',
    'fiche-admission',
    'parametres',
    'journal',
  ],
  [ROLE_SECRETARIAT]: [
    'dashboard',
    'eleves',
    'classes',
    'classe',
    'emploi-du-temps',
    'personnel',
    'fiche-personnel',
    'messagerie',
    'matieres',
    'notes',
    'absences',
    'fiche',
    'admissions',
    'fiche-admission',
  ],
  [ROLE_COMPTABLE]: [
    'dashboard',
    'eleves',
    'classes',
    'classe',
    'finances',
    'messagerie',
  ],
  [ROLE_ENSEIGNANT]: [
    'dashboard',
    'eleves',
    'classes',
    'classe',
    'emploi-du-temps',
    'matieres',
    'notes',
    'absences',
    'messagerie',
  ],
};

/**
 * Vérifie si un utilisateur possède une permission spécifique.
 *
 * @param {Object} user
 * @param {string} permission
 * @returns {boolean}
 */
export function hasPermission(user, permission) {
  if (!user?.role) return false;

  const explicit = Array.isArray(user.permissions) ? user.permissions : [];
  const allowed = explicit.length > 0 ? explicit : (ROLE_PERMISSIONS[user.role] || []);

  return allowed.includes(permission);
}

/**
 * Vérifie si un utilisateur peut accéder à une page.
 *
 * @param {Object} user
 * @param {string} pageId
 * @returns {boolean}
 */
export function canAccessPage(user, pageId) {
  if (!user?.role) return false;

  return (ROLE_PAGES[user.role] || []).includes(pageId);
}