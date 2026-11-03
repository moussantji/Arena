# Kalanso — gestion d'école

Application desktop de gestion d'école : interface React, API Laravel, coquille
Electron et connexion Google. Palette **Indigo Minuit** (`#070B1F` · `#5B7CFA` ·
`#E0A86F`).

L'application ne contient **aucun compte ni aucune donnée de démonstration** :
au premier lancement, un écran de configuration crée l'établissement, l'année
scolaire et le premier compte Direction. Les vraies données sont ensuite saisies
directement dans Kalanso.

## Contenu

| Dossier | Contenu |
|---|---|
| `app/` | **Application React** — interface desktop branchée sur l'API, composants et modales personnalisées |
| `api/` | **API REST Laravel 13 + MySQL/MariaDB** — élèves, classes, notes, finances, admissions, messagerie, configuration initiale et connexion Google |
| `figma/` | **Plugin Figma** qui génère les styles, composants, écrans et la modale + tokens |
| `gallery/` | Écrans d'accueil (exports PNG) et coquille Electron |

## Démarrer

```bash
# interface React en développement (HMR)
cd app && npm install && npm run dev      # http://localhost:5179

# application desktop : build React + coquille Electron
cd app && npm install && npm run build
cd ../gallery/electron && npm install && npm start

# coquille Electron + serveur Vite (HMR, profil de développement séparé)
cd gallery/electron && npm run dev

# galerie statique des écrans exportés
node gallery/server.js 4173

# API Laravel + MySQL (mode développement web / HMR)
cd api && composer install
cp .env.example .env && php artisan key:generate   # renseigner DB_* dans .env
php artisan migrate                                # base vide, sans données de test
php artisan storage:link
php artisan serve --host=127.0.0.1 --port=8001     # http://127.0.0.1:8001/api

# paquet Ubuntu : AppImage + .deb
cd gallery/electron && npm install
npm run dist:linux                                 # → release/
```

## Première connexion

Kalanso s'ouvre **directement sur l'écran de connexion**.

- Si la base est vide et que Google est configuré, la **première connexion
  Google** crée automatiquement le compte Direction (établissement et année
  scolaire par défaut, à personnaliser dans **Paramètres**).
- Sans Google, un lien discret **Première installation** ouvre le formulaire
  de création du premier compte Direction : établissement, année scolaire
  (3 trimestres) et mot de passe.
- La route `POST /api/setup` se ferme ensuite définitivement dès qu'un compte
  existe. Il n'y a aucun compte de démonstration.

## Connexion Google

1. Dans **Google Cloud Console → API et services → Identifiants**, créez un
   identifiant OAuth de type **Application de bureau**.
2. Renseignez `api/.env` puis redémarrez l'application :

```dotenv
GOOGLE_CLIENT_ID=votre-identifiant.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=votre-secret
```

Le bouton **Continuer avec Google** ouvre le navigateur du poste, reçoit le
code sur une boucle locale Electron avec **PKCE**, puis l'API échange le code
contre un token Sanctum. Le secret reste côté API. La connexion est réservée
aux comptes Kalanso existants : le compte est lié automatiquement lorsque
l'adresse e-mail Google vérifiée correspond à un utilisateur.

> Application déjà installée : l'API copiée se trouve dans
> `~/.config/kalanso-desktop/backend/.env`. Renseignez-y les mêmes variables si
> vous n'avez pas modifié `api/.env` avant le premier lancement.

## API

Le dossier `api/` contient une API REST Laravel 13 adossée à MySQL/MariaDB.
Elle expose le domaine de l'école : élèves, classes, matières, personnel,
emploi du temps, notes, absences, factures, paiements, admissions, messagerie,
documents, photos de profil et notifications.

- Documentation complète : [`api/README.md`](api/README.md)
- Base locale : `arena` (nom technique conservé pour les postes déjà installés)
- Configuration : `POST /api/setup`, état : `GET /api/setup/status`
- Connexion Google : `GET /api/auth/google/status` et `POST /api/auth/google/exchange`
- Authentification : **Sanctum** (token Bearer) ; toutes les routes métier sont protégées
- Photos : table `photos`, méthodes `attachfiles()` / `getImageUrl()`, endpoints protégés et URLs `photo_url` dans les réponses

```bash
# vérifier l'API
curl http://127.0.0.1:8001/api/health

# savoir si la première configuration est requise
curl http://127.0.0.1:8001/api/setup/status

# se connecter (après la configuration)
curl -X POST http://127.0.0.1:8001/api/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"direction@mon-ecole.com","password":"motdepasse123"}'
```

## Tests

```bash
# tests API (SQLite en mémoire, la base réelle n'est pas modifiée)
cd api && php artisan test
```

Les tests nécessitent l'extension PHP `pdo_sqlite`. Le build front se vérifie avec :

```bash
cd app && npm run build
```

## Application desktop Ubuntu

L'application Electron intègre le build React et démarre automatiquement l'API
Laravel locale : aucun terminal n'est nécessaire après installation.

```bash
# paquets générés dans release/
cd gallery/electron && npm run dist:linux

# installation du .deb (menu Applications → Kalanso)
sudo apt install ./release/Kalanso-1.1.0-amd64.deb

# ou exécution directe de l'AppImage
chmod +x release/Kalanso-1.1.0-x86_64.AppImage
./release/Kalanso-1.1.0-x86_64.AppImage
```

Prérequis sur la machine : **PHP 8.2+ CLI** et **MariaDB/MySQL** actifs, avec la
base et les identifiants renseignés dans `api/.env`. Au premier lancement,
Electron copie l'API dans `~/.config/kalanso-desktop/backend`, applique les
migrations puis démarre le service sur `127.0.0.1:8001`. Les journaux sont dans
`~/.config/kalanso-desktop/logs/` (`main.log` pour le démarrage de la fenêtre,
`backend.log` pour l'API).

Sur Linux, le rendu GPU est désactivé par défaut pour éviter les fenêtres
noires sur certaines cartes graphiques. `KALANSO_GPU=1 kalanso` réactive
l'accélération matérielle.

Pour développer avec HMR : `cd gallery/electron && npm run dev`. La commande
démarre Vite si nécessaire, puis ouvre Electron sur `http://127.0.0.1:5179` en
réutilisant l'API locale du port 8001. Les modifications React/CSS sont
appliquées à chaud ; `main.js` et `preload.js` nécessitent un redémarrage. Le
mode développement utilise le profil `~/.config/kalanso-desktop-dev` et peut donc
tourner en même temps que l'application installée. Pour ouvrir les DevTools :
`KALANSO_DEVTOOLS=1 npm run dev`. Pour lancer la version desktop locale sans
paquet : `npm start` dans `gallery/electron`.

L'icône Kalanso par défaut est générée dans
`gallery/electron/build/icon.png` (source vectorielle `icon.svg`) et reprise
dans l'interface. Elle est remplaçable à tout moment depuis **Paramètres →
Établissement → Remplacer le logo** : le logo de l'établissement remplace
l'icône par défaut partout dans l'application.

## Figma

Voir `figma/README.md` : importer `figma/kalanso-indigo/manifest.json` comme
plugin de développement, puis **Plugins → Development → Kalanso — Indigo
Minuit**. Le fichier `figma/Kalanso-Indigo-Minuit.sketch` reste disponible pour
un import direct.

## Écrans

Écrans React (composants) : tableau de bord, élèves, classes, fiche classe,
emploi du temps, finances, personnel, fiche personnel, messagerie, matières,
notes, absences, fiche élève, admissions, fiche admission, paramètres, plus une
page **Modales** de vitrine des composants.

Modales personnalisées : formulaire, paiement, confirmation destructive,
justificatif, export, rédaction, succès et panneau latéral — pile, focus piégé,
animations.

Écrans exportés (PNG, 1312 × 816) : `gallery/palettes/indigo-page-*.png`
+ bannière `hero-06-indigo-minuit.png` et planche `palette-3-indigo-minuit.png`.

## Conventions

- Une seule direction visuelle : **Indigo Minuit**, un accent unique.
- Aucune donnée métier en dur dans les écrans : tout passe par l'API Laravel.
- Tokens centralisés dans `app/src/styles.css` (variables CSS) et
  `figma/kalanso-indigo/tokens.json`.
