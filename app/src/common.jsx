/* ============================================================
   Kalanso — fonctions communes de gestion des permissions
   Source unique : auth.js (rôles, permissions et pages autorisées)
   ============================================================ */

import { useData } from './data.jsx';
import {
  canAccessPage, hasPermission, ROLE_LABELS, ROLE_PAGES,
} from './auth.js';

export { canAccessPage, hasPermission } from './auth.js';

/**
 * Filtre les éléments d'une navigation par rôle.
 *
 * @param {Object} nav
 * @param {Object} user
 * @returns {Object}
 */
export function filterNavByRole(nav, user) {
  if (!user?.role) return nav;

  return Object.entries(nav).reduce((acc, [group, items]) => {
    const visible = items.filter((item) => !item.hidden && canAccessPage(user, item.id));
    if (visible.length) {
      acc[group] = visible;
    }
    return acc;
  }, {});
}

/**
 * Récupère le libellé d'un rôle.
 *
 * @param {string} role
 * @returns {string}
 */
export function getRoleLabel(role) {
  return ROLE_LABELS[role] || 'Invité';
}

/**
 * Récupère les pages autorisées pour un rôle.
 *
 * @param {string} role
 * @returns {Array}
 */
export function getRolePages(role) {
  return ROLE_PAGES[role] || [];
}

/**
 * Hook pour vérifier les permissions.
 *
 * @returns {Function}
 */
export function useCan() {
  const { user } = useData();

  return (permission) => hasPermission(user, permission);
}

/**
 * Hook pour vérifier l'accès aux pages.
 *
 * @returns {Function}
 */
export function useCanAccessPage() {
  const { user } = useData();

  return (pageId) => canAccessPage(user, pageId);
}
