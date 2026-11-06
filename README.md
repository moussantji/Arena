# Kalanso — gestion d'école

![CI](https://github.com/moussantji/Arena/actions/workflows/ci.yml/badge.svg)

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

# installateur Windows (.exe, construit via Wine)
npm run dist:win                                   # → release/Kalanso-Setup-x.y.z.exe
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

> Les identifiants Google (`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`) sont
> définis **côté serveur** (celui de l'établissement — sur LWS en production),
> pas sur chaque poste.

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
# utilisez le PHP qui dispose de pdo_sqlite (php8.4 sur ce poste)
cd api && php8.4 artisan test
```

Les tests nécessitent l'extension PHP `pdo_sqlite`. Le build front se vérifie avec :

```bash
cd app && npm run build
```

## Intégration continue

Le workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) vérifie à
chaque push et pull request, sans rien mettre en ligne :

1. **API** — installation des dépendances et `php artisan test` (SQLite en
   mémoire, PHP 8.4) ;
2. **Interface** — `npm ci` puis `npm run build` ;
3. **Desktop** — vérification de syntaxe du processus principal et
   construction du paquet Linux **sans publication**
   (`electron-builder --linux dir --publish never`), avec cache des
   binaires Electron.

Les déploiements (serveur LWS, GitHub Releases) restent des actions
manuelles et ne font pas partie de la CI.

## Application desktop (Windows / Linux)

L'application Electron est un **client** du serveur de l'établissement : elle
se connecte à `https://kalanso.mandenbaoubab.com` par défaut — le même serveur
que l'application mobile. Aucun serveur Laravel/PHP/MySQL n'est embarqué ni
démarré sur le poste ; rien à installer, aucun identifiant dans le paquet.
Les données sont celles du serveur, en temps réel.

```bash
# paquets générés dans release/
cd gallery/electron && npm run dist:linux

# installation du .deb (menu Applications → Kalanso)
sudo apt install ./release/Kalanso-<version>-amd64.deb

# ou exécution directe de l'AppImage
chmod +x release/Kalanso-<version>-x86_64.AppImage
./release/Kalanso-<version>-x86_64.AppImage
```

**Configuration par poste** : aucune au premier lancement. Le créateur peut
modifier le serveur (Paramètres → Serveur de données) ; le réglage est écrit
dans `~/.config/kalanso-desktop/config/.env` (les anciennes installations
utilisent encore `~/.config/kalanso-desktop/backend/.env`, conservé tel quel).
Les journaux sont dans `~/.config/kalanso-desktop/logs/` (`main.log`).

Sur Linux, le rendu GPU est désactivé par défaut pour éviter les fenêtres
noires sur certaines cartes graphiques. `KALANSO_GPU=1 kalanso` réactive
l'accélération matérielle.

Pour développer avec HMR : `cd gallery/electron && npm run dev`. La commande
démarre Vite si nécessaire, puis ouvre Electron sur `http://127.0.0.1:5179`.
Le mode développement utilise le profil `~/.config/kalanso-desktop-dev`. Pour
indiquer le serveur à l'app en développement : `KALANSO_REMOTE_API_URL`
(défaut : le serveur de l'établissement ; `local` = `http://127.0.0.1:8001`
avec un serveur démarré à la main). Les modifications React/CSS sont
appliquées à chaud ; `main.js` et `preload.js` nécessitent un redémarrage.
Pour ouvrir les DevTools : `KALANSO_DEVTOOLS=1 npm run dev`. Pour lancer la
version desktop locale sans paquet : `npm start` dans `gallery/electron`.

L'icône Kalanso par défaut est générée dans
`gallery/electron/build/icon.png` (source vectorielle `icon.svg`) et reprise
dans l'interface. Elle est remplaçable à tout moment depuis **Paramètres →
Établissement → Remplacer le logo** : le logo de l'établissement remplace
l'icône par défaut partout dans l'application.

## Mises à jour et nouveautés

**Dans l'application** : **Paramètres → Préférences → Mises à jour**.
Le bouton « Vérifier les mises à jour » recherche une nouvelle version, la
télécharge dans l'application avec une barre de progression, puis propose de
redémarrer pour l'installer :

- **AppImage** : le fichier est remplacé automatiquement puis l'application
  redémarre ;
- **.deb** : l'installation passe par le gestionnaire de paquets du système,
  un mot de passe peut être demandé ;
- **Windows (.exe)** : l'installateur NSIS se met à jour automatiquement
  (dans l'application ou au redémarrage).

**Canal GitHub Releases** : les mises à jour sont publiées dans les releases du
dépôt public `moussantji/Arena`. L'application lit automatiquement
`latest.yml` (Windows) ou `latest-linux.yml` (Linux) de la dernière release —
aucune URL à renseigner.

Publier une version, au choix :

```bash
# publication automatique de tous les paquets (jeton GitHub avec Contents: read and write)
cd gallery/electron
GH_TOKEN=ghp_votre_jeton npm run dist:all:publish
```

Ceci construit `Kalanso-Setup-x.y.z.exe` (installateur Windows), les paquets
Linux AppImage et .deb, puis les joint toutes à la release `vX.Y.Z` avec
`latest.yml` et `latest-linux.yml`. Pour ne builder qu'une seule plateforme :
`npm run dist:win:publish` ou `npm run dist:linux:publish`.

ou manuellement :

1. Incrémenter `version` dans `gallery/electron/package.json` et ajouter
   l'entrée dans `app/src/changelog.js` et `CHANGELOG.md` ;
2. `cd gallery/electron && npm run dist:win && npm run dist:linux` ;
3. Sur GitHub, créer une **release** et y joindre les fichiers de `release/` :
   `latest.yml`, `latest-linux.yml`, `Kalanso-Setup-x.y.z.exe`,
   `Kalanso-x.y.z-x86_64.AppImage`, `Kalanso-x.y.z-amd64.deb`.

Les paquets Windows sont construits sur Linux via Wine et ne sont **pas
signés** : au premier lancement, Windows SmartScreen affichera une
avertissement (« Informations complémentaires » → « Exécuter quand même »).
Pour supprimer cet avertissement, il faut un certificat de signature Windows
(achat auprès d'une autorité de certification) ; `electron-builder` le prend
en charge automatiquement dès qu'un certificat est fourni.

Un canal privé ou local reste possible : renseignez `KALANSO_UPDATE_URL`
(dossier ou serveur contenant `latest-linux.yml`) dans
`~/.config/kalanso-desktop/config/.env`. Pour un essai :
`cd release && python3 -m http.server 8099` puis lancer avec
`KALANSO_UPDATE_URL=http://127.0.0.1:8099`.

À la première ouverture après une mise à jour, la fenêtre **Nouveautés**
s'affiche une fois par version ; elle reste consultable dans
**Paramètres → Préférences → Nouveautés**.

**Configuration de chaque poste** : aucune — les paquets ne contiennent
aucun identifiant et aucune donnée. La configuration éventuelle
(`~/.config/kalanso-desktop/config/.env`, créée au premier lancement) ne
contient que le serveur de données et, optionnellement, le canal de mise à
jour ; elle est conservée lors des mises à jour.

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
