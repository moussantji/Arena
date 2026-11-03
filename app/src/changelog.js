/* ============================================================
   Kalanso — journal des versions
   À chaque mise à jour : incrémenter APP_VERSION, ajouter une
   entrée en tête de CHANGELOG, puis reconstruire les paquets.
   ============================================================ */

export const APP_VERSION = '1.3.0';

export const CHANGELOG = [
  {
    version: '1.3.0',
    date: '3 novembre 2026',
    title: 'Mises à jour intégrées',
    items: [
      'Nouvelle section Paramètres → Préférences → Mises à jour.',
      'Vérification des mises à jour directement dans l’application.',
      'Téléchargement avec barre de progression.',
      'Installation et redémarrage en un clic, sans passer par un terminal.',
    ],
  },
  {
    version: '1.2.0',
    date: '3 novembre 2026',
    title: 'Profils et nouveautés',
    items: [
      'Fiche de profil accessible depuis l’avatar et la barre latérale.',
      'Clic sur une ligne du tableau des utilisateurs pour afficher le compte.',
      'Changement de photo de profil directement depuis la fiche.',
      'Fenêtre « Nouveautés » affichée une fois à chaque mise à jour.',
      'Correction de l’affichage de la cloche de notifications.',
    ],
  },
  {
    version: '1.1.0',
    date: '3 novembre 2026',
    title: 'Première connexion Google',
    items: [
      'L’application s’ouvre directement sur la connexion.',
      'La première connexion Google crée le compte Direction.',
      'Connexion Google pour les comptes existants, avec liaison par e-mail vérifié.',
      'Suppression de tous les comptes et données de démonstration.',
      'Nouvelle icône Kalanso, remplaçable depuis les paramètres.',
    ],
  },
];
