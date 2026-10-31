# DIALLO — école premium

Direction artistique et maquettes d'une application de gestion d'école.
Palette retenue : **Indigo Minuit** (`#070B1F` · `#5B7CFA` · `#E0A86F`).

## Contenu

| Dossier | Contenu |
|---|---|
| `app/` | **Application React** — interface desktop branchée sur l'API, composants et modales personnalisées |
| `api/` | **API REST Laravel 13 + MySQL/MariaDB** — élèves, classes, notes, finances, admissions, messagerie |
| `figma/` | **Plugin Figma** qui génère les styles, composants, 14 écrans et la modale + tokens |
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
php artisan migrate:fresh --seed
php artisan storage:link
php artisan serve --host=127.0.0.1 --port=8001   # http://127.0.0.1:8001/api

# paquet Ubuntu : AppImage + .deb
cd gallery/electron && npm install
npm run dist:linux                                # → release/
```

## API

Le dossier `api/` contient une API REST Laravel 13 adossée à MySQL/MariaDB.
Elle expose le domaine de l'école : élèves, classes, matières, personnel,
emploi du temps, notes, absences, factures, paiements, admissions, messagerie,
documents, photos de profil et notifications.

- Documentation complète : [`api/README.md`](api/README.md)
- Base locale : `arena` (MariaDB/MySQL)
- Compte de démonstration : `direction@diallo.test` / `password`
- Authentification : **Sanctum** (token Bearer) ; lectures publiques, écritures protégées
- Photos : table `photos`, méthodes `attachfiles()` / `getPhoto()` / `getImageUrl()`, endpoints protégés et URLs `photo_url` dans les réponses
- Jeu de données : 186 élèves, 6 classes, 14 matières, 2 790 notes, 253 factures

```bash
# se connecter et récupérer un token
curl -X POST http://127.0.0.1:8001/api/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"direction@diallo.test","password":"password"}'

# vérifier l'API
curl http://127.0.0.1:8001/api/dashboard
```

L'interface React consomme directement cette API via `app/src/api.js` et le
contexte `app/src/data.jsx` : listes paginées, filtres serveur, agrégats du
tableau de bord et formulaires de création, modification et suppression pour
chaque domaine. Le compte de démonstration est utilisé automatiquement pour
obtenir le token Sanctum nécessaire aux écritures.

## Application desktop Ubuntu

L'application Electron intègre le build React et démarre automatiquement l'API
Laravel locale : aucun terminal n'est nécessaire après installation.

```bash
# paquets générés dans release/
cd gallery/electron && npm run dist:linux

# installation du .deb (menu Applications → DIALLO)
sudo apt install ./release/DIALLO-1.0.0-amd64.deb

# ou exécution directe de l'AppImage
chmod +x release/DIALLO-1.0.0-x86_64.AppImage
./release/DIALLO-1.0.0-x86_64.AppImage
```

Prérequis sur la machine : **PHP 8.2+ CLI** et **MariaDB/MySQL** actifs, avec la
base et les identifiants renseignés dans `api/.env`. Au premier lancement,
Electron copie l'API dans `~/.config/diallo-desktop/backend`, applique les
migrations puis démarre le service sur `127.0.0.1:8001`. Les journaux sont dans
`~/.config/diallo-desktop/logs/` (`main.log` pour le démarrage de la fenêtre,
`backend.log` pour l'API).

Sur Linux, le rendu GPU est désactivé par défaut pour éviter les fenêtres
noires sur certaines cartes graphiques. `DIALLO_GPU=1 diallo` réactive
l'accélération matérielle.

Pour développer avec HMR : `cd gallery/electron && npm run dev`. La commande
démarre Vite si nécessaire, puis ouvre Electron sur `http://127.0.0.1:5179` en
réutilisant l'API locale du port 8001. Les modifications React/CSS sont
appliquées à chaud ; `main.js` et `preload.js` nécessitent un redémarrage. Le
mode développement utilise le profil `~/.config/diallo-desktop-dev` et peut donc
tourner en même temps que l'application installée. Le lanceur `diallo-dev`
(installé dans `~/.local/bin`) fait la même chose depuis n'importe quel dossier.
Pour ouvrir les DevTools : `DIALLO_DEVTOOLS=1 diallo-dev`. Pour lancer la
version desktop locale sans paquet : `npm start`.

## Figma

Voir `figma/README.md` : importer `figma/diallo-indigo/manifest.json` comme plugin
de développement, puis **Plugins → Development → DIALLO — Indigo Minuit**.

## Écrans

Écrans React (composants) : tableau de bord, élèves, classes, emploi du temps,
finances, personnel, messagerie, matières, notes, absences, fiche élève, admissions, paramètres,
plus une page **Modales** de démonstration.

Modales personnalisées : formulaire, paiement, confirmation destructive, justificatif,
export, rédaction, succès et panneau latéral — pile, focus piégé, animations.

Écrans exportés (PNG, 1312 × 816) : `gallery/palettes/indigo-page-*.png` (12 fichiers)
+ bannière `hero-06-indigo-minuit.png` et planche `palette-3-indigo-minuit.png`.

## Conventions

- Une seule direction visuelle : **Indigo Minuit**, un accent unique.
- Aucune donnée métier en dur dans les écrans : tout passe par l'API Laravel.
- Tokens centralisés dans `app/src/styles.css` (variables CSS) et `figma/diallo-indigo/tokens.json`.
