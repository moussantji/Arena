# Journal des versions — Kalanso

Ce fichier documente les nouveautés visibles pour les utilisateurs. La même
liste est embarquée dans l'application (`app/src/changelog.js`) et affichée
une fois par version dans la fenêtre **Nouveautés**.

## 1.3.2 — à paraître

- Nouveau bandeau « hors-ligne » : quand le serveur ne répond plus, un
  bandeau le signale et la reconnexion est tentée automatiquement toutes
  les 10 secondes (bouton « Réessayer » pour forcer une sonde).
- Écran « Serveur injoignable » épuré et bouton Réessayer.
- Paquets plus légers : les dépendances de développement de l'API Laravel
  (phpunit, faker…) ne sont plus embarquées — environ 30 Mo de moins par
  paquet. La liste est dérivée automatiquement de `api/composer.lock`.
- Sécurité : `api/storage/**` (photos et documents saisis sur le poste de
  build) ne peut plus être embarqué dans l'installateur — les dossiers
  nécessaires sont recréés à l'installation.
- Intégration continue GitHub Actions : tests API (SQLite en mémoire),
  build React et construction du paquet Linux (sans publication) à chaque
  push et pull request.

## 1.3.1 — 3 novembre 2026

- Les mises à jour sont publiées et téléchargées depuis GitHub Releases.
- Les paquets ne contiennent plus aucun identifiant : la configuration reste
  sur chaque poste.
- La configuration (.env) est créée automatiquement au premier lancement.

## 1.3.0 — 3 novembre 2026

- Nouvelle section Paramètres → Préférences → Mises à jour.
- Vérification des mises à jour directement dans l'application.
- Téléchargement avec barre de progression.
- Installation et redémarrage en un clic, sans passer par un terminal.

## 1.2.0 — 3 novembre 2026

- Fiche de profil accessible depuis l'avatar et la barre latérale.
- Clic sur une ligne du tableau des utilisateurs pour afficher le compte.
- Changement de photo de profil directement depuis la fiche.
- Fenêtre « Nouveautés » affichée une fois à chaque mise à jour.
- Correction de l'affichage de la cloche de notifications.

## 1.1.0 — 3 novembre 2026

- L'application s'ouvre directement sur la connexion.
- La première connexion Google crée le compte Direction.
- Connexion Google pour les comptes existants (liaison par e-mail vérifié).
- Suppression de tous les comptes et données de démonstration.
- Nouvelle icône Kalanso, remplaçable depuis les paramètres.
- Configuration initiale avec établissement, année et trois trimestres.
- Renommage complet de l'application en Kalanso.
