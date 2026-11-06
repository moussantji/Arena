/* ============================================================
   Kalanso — journal des versions
   À chaque mise à jour : incrémenter APP_VERSION, ajouter une
   entrée en tête de CHANGELOG, puis reconstruire les paquets.
   ============================================================ */

export const APP_VERSION = '1.3.4';

export const CHANGELOG = [
  {
    version: '1.3.4',
    date: '6 novembre 2026',
    title: 'Application connectée au serveur',
    items: [
      'Le logiciel PC n’embarque plus aucun serveur : il se connecte exclusivement au serveur de l’établissement — rien à installer, aucun XAMPP/MySQL sur les postes.',
      'Installateurs allégés (l’API embarquée a été retirée du paquet).',
      'Écran d’erreur « L’API locale n’a pas pu démarrer » supprimé : l’application s’ouvre toujours — en cas de serveur injoignable, l’interface affiche son bandeau « hors-ligne » et « Serveur injoignable » avec Réessayer.',
      'Configuration par poste conservée (serveur modifiable par le créateur) ; les réglages des anciennes installations sont repris tels quels.',
      'Tapez « local » dans Paramètres → Serveur de données pour forcer http://127.0.0.1:8001 (développement uniquement).',
    ],
  },
  {
    version: '1.3.3',
    date: '6 novembre 2026',
    title: 'Connexion au serveur par défaut',
    items: [
      'Une installation neuve pointe désormais sur le serveur de l’établissement (https://kalanso.mandenbaoubab.com), comme l’application mobile — plus besoin de XAMPP sur les postes.',
      'Les installations existantes ne sont pas migrées silencieusement : basculez dans Paramètres → Serveur de données (réservé au créateur).',
      'Écran « API Kalanso » adapté au mode distant (plus de référence au serveur local).',
    ],
  },
  {
    version: '1.3.2',
    date: '6 novembre 2026',
    title: 'Robustesse et finition',
    items: [
      'Bandeau « hors-ligne » : quand le serveur ne répond plus, un bandeau le signale et la reconnexion est tentée automatiquement.',
      'Écran « Serveur injoignable » épuré, avec bouton Réessayer.',
      'Paquets plus légers : les dépendances de développement ne sont plus embarquées (~30 Mo de moins).',
      'Les photos et documents présents sur le poste de build ne peuvent plus être embarqués dans l’installateur.',
      'Connexions (réussies et échouées) journalisées ; un changement de mot de passe révoque immédiatement toutes les sessions du compte.',
      'Mots de passe : 10 caractères minimum pour les nouveaux comptes.',
      'Restriction PC : enseignants et (bientôt) parents ne peuvent plus se connecter à l’application de bureau — réservée à la direction, au secrétariat et à la comptabilité.',
      'Le serveur de données est réservé au créateur de l’établissement.',
      'Nouveauté : comptes parents — créés par la direction sur le PC, connectés depuis l’application mobile (notes, absences, finances de leurs enfants uniquement).',
      'Nouveauté : application mobile Kalanso (Android) — écran par rôle (parent, enseignant, direction) ; la messagerie y est cloisonnée par fil pour les parents.',
      'Application mobile : refonte « Indigo Minuit réhaussée » (fond aurore, verre dépoli, indigo → champagne) — et nouvel écran Emploi du temps.',
    ],
  },
  {
    version: '1.3.1',
    date: '3 novembre 2026',
    title: 'Mises à jour via GitHub',
    items: [
      'Les mises à jour sont publiées et téléchargées depuis GitHub Releases.',
      'Les paquets ne contiennent plus aucun identifiant : la configuration reste sur chaque poste.',
      'La configuration (.env) est créée automatiquement au premier lancement.',
    ],
  },
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
