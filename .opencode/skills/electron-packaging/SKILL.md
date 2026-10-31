---
name: electron-packaging
description: Shell Electron de DIALLO dans gallery/electron/ — cycle de vie du backend PHP embarqué, profile userData, logs, extraResources electron-builder, variables DIALLO_*/ARENA_*, sortie release/. À utiliser pour « build », « AppImage », « le paquet ne démarre pas », « PHP introuvable », « backend copié », « splash », « preload ». Exemples : « ajouter une ressource au paquet », « la version installée ne migre pas ».
---
# Shell desktop — `gallery/electron/`

Electron 33 charge le build React (`app/dist`) et **lance l'API Laravel en local**
(`php -S 127.0.0.1:<port> server.php` dans `public/`). Il n'y a pas de `package.json` à la
racine : le front, l'API et le shell sont trois projets distincts.

| Fichier | Rôle |
|---|---|
| `main.js` | Profile/userData, copie du backend, détection PHP, migration, serveur PHP, `probeApi`, fenêtre, splash, logs |
| `preload.js` | Surface `desktopAPI` exposée au renderer (`platform`, `minimize`, `toggleMaximize`, `close`, `onState`) |
| `dev.js` | Réutilise le Vite déjà lancé sur 5179 puis `electron . --dev --no-sandbox` |
| `splash.html` | Écran d'attente pendant le démarrage du backend |
| `package.json` | Scripts + bloc `build` electron-builder |

## Scripts (à utiliser tels quels)

```bash
cd gallery/electron
npm run dev          # node dev.js — HMR Vite + Electron, ne rebuild pas
npm run dev:electron # electron . --dev (si Vite tourne déjà ailleurs)
npm run start        # prestart → build:app, puis electron .
npm run dist:linux   # build:app + electron-builder --linux AppImage deb
npm run dist:dir     # build:app + electron-builder --linux dir (test rapide du paquet)
```

`build:app` = `npm --prefix ../../app run build`. Le paquet se lit **depuis** `app/dist`
et `api/` : jamais de copie manuelle dans `release/`.

## Règle de relance

- Modification dans `app/` (React, CSS) → **HMR Vite**, rien à relancer.
- Modification dans `main.js` ou `preload.js` → **relancer `npm run dev`** (pas de hot reload du main process).
- Modification dans `api/` → le backend en dev est l'API du repo ; en paquet, il est une **copie** (voir plus bas).

## Ce que contient le paquet (`build` dans `package.json`)

- `appId com.diallo.arena`, `productName DIALLO`, `executableName diallo`,
  `artifactName DIALLO-${version}-${arch}.${ext}`, `asar: true`, `npmRebuild: false`.
- Sortie : `../../release`.
- `files` : `main.js`, `preload.js`, `splash.html`, `build/icon.png`, `package.json` —
  **rien d'autre** n'est dans l'asar : tout le reste passe par `extraResources`.
- `extraResources` : `../../app/dist` → `app/`, `../../api` → `api/` avec exclusions
  `!tests/**`, `!phpunit.xml`, `!README.md`, `!storage/logs/**`, `!storage/framework/**`,
  `!bootstrap/cache/*.php`.
- Linux : AppImage + deb x64, `StartupWMClass: diallo-desktop`, icône `build/icon.png`.

**Une nouvelle ressource à embarquer se déclare dans `extraResources`, pas dans `files`.**
Un fichier nécessaire au runtime placé dans `files` se retrouve dans l'asar et n'est pas
accessible en système de fichiers (PHP ne lit pas l'asar).

## Backend embarqué : copie + versionnage

Au lancement packagé, `api/` est copié dans `userData/backend`
(`~/.config/diallo-desktop/backend`) via `/bin/cp -a`, puis :

- marqueur `.bundle-version` = `version-mtime` du paquet ; la copie est refaite quand il change ;
- le `storage/app` existant est sauvegardé puis **fusionné** (les données de l'utilisateur survivent) ;
- le symlink `public/storage` est reconstruit en relatif (`../storage/app/public`) ;
- un `.env` doit être présent dans le paquet, sinon erreur « Configuration .env absente du paquet API. » ;
- `php artisan migrate --force --no-interaction` (cap 30 s) **seulement si packagé et fraîchement rafraîchi** —
  ne jamais migrer en dev.

Ne pas mettre de données, de `.env` ou de logs dans `api/` du repo : ils voyageraient dans le paquet.

## Variables d'environnement

| Variable | Effet |
|---|---|
| `ARENA_API_PORT` | Port de l'API locale (défaut `8001`) |
| `ARENA_PHP_BIN` | Premier candidat de `findPhp()` (puis `/usr/bin/php`, `/usr/local/bin/php`) |
| `DIALLO_DEV_PROFILE` | Profile userData séparé en dev (`~/.config/diallo-desktop-dev`) : la version installée et le dev peuvent coexister |
| `DIALLO_DEVTOOLS=1` | Ouvre DevTools au lancement |
| `DIALLO_GPU=1` | Réactive le GPU sous Linux ( désactivé par défaut ) |

## Diagnostics quand le shell ne démarre pas

Logs : `userData/logs/main.log` et `userData/logs/backend.log`.
`probeApi` attend `"status":"ok"` sur `/api/health`. Chaînes d'erreur attendues :

- « Configuration .env absente du paquet API. » → `api/.env` absent du paquet.
- « PHP est introuvable. Installez php-cli (sudo apt install php-cli). » → pas de PHP 8.2+ CLI.
- « Les dépendances Laravel (vendor) sont absentes du paquet. » → `api/vendor` non packagé.
- « L'API locale n'a pas démarré. Consultez …/backend.log. » → `php -S` échoue (port, DB).
- Dialog « Service local indisponible » / « L'API locale n'a pas pu démarrer. », hint
  `sudo apt install php-cli mariadb-server`, `sudo systemctl start mariadb`, boutons
  `['Continuer', 'Quitter']`.

`stopBackend()` tue le **groupe** du process (`-pid`) : SIGTERM puis SIGKILL après 1,5 s.
Ne pas changer la création du process sans adapter ce teardown.

## Fenêtre et renderer

1440 × 900, `frame: false`, `backgroundColor '#070B1F'`. Le renderer ne touche que
`desktopAPI` (skill `react-ui`). Index chargé : `PACKAGED_APP_INDEX` si packagé, sinon
`app/dist/index.html`, fallback `gallery/index.html` — ne pas retirer le fallback.

## Avant de conclure

Voir `references/checklist.md` (liste de vérifications d'un paquet Linux).

```bash
cd gallery/electron && npm run dist:dir   # puis lancer le dir/ et lire backend.log
```
