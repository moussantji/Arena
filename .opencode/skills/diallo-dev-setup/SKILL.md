---
name: diallo-dev-setup
description: Démarrer, configurer et dépanner l'environnement de développement du projet DIALLO — lancement de l'API Laravel, du front React/Vite, du shell Electron en HMR, base de données locale, compte de démonstration, variables d'environnement. À utiliser pour « lancer le projet », « ça ne démarre pas », « CORS », « base de données », « installer le projet ».
---

# DIALLO — environnement de développement

DIALLO est une application **desktop** de gestion d'école : interface React (`app/`),
API Laravel (`api/`), coquille Electron (`gallery/electron`), export PPTX (`tools/`),
design system Figma/Sketch (`figma/`). Les trois processus doivent tourner ensemble.

## Démarrage (trois terminaux)

```bash
cd api && php artisan serve --host=127.0.0.1 --port=8001   # API Laravel
cd app && npm run dev                                     # Vite sur 0.0.0.0:5179
cd gallery/electron && npm run dev                        # Electron + HMR
```

`gallery/electron` → `npm run dev` (via `dev.js`) démarre Vite si nécessaire puis ouvre
Electron sur `http://127.0.0.1:5179` en réutilisant l'API du port 8001. React/CSS sont
appliqués à chaud ; `main.js` et `preload.js` **nécessitent un redémarrage**.

- Launcher global : `diallo-dev` (installé dans `~/.local/bin`), même chose depuis n'importe quel dossier.
- DevTools : `DIALLO_DEVTOOLS=1 diallo-dev`. GPU : désactivé par défaut, `DIALLO_GPU=1` le réactive.
- Version desktop locale sans paquet : `cd gallery/electron && npm start` (fait `build:app` puis `electron .`).
- Profil de développement : `~/.config/diallo-desktop-dev` (distinct de l'app installée `~/.config/diallo-desktop`) → les deux peuvent coexister.

## Installation d'une copie neuve

```bash
cd api && composer install
cp .env.example .env && php artisan key:generate
php artisan migrate --force          # seed included ? vérifier database/seeders
cd ../app && npm install
cd ../gallery/electron && npm install
```

`composer setup` exécute cette chaîne (install, .env, key, migrate, npm install, build).

## Base de données

- `.env.example` : `DB_CONNECTION=mysql`, `DB_HOST=127.0.0.1`, `DB_PORT=3306`,
  `DB_DATABASE=arena`, `DB_USERNAME=arena`, `DB_PASSWORD=` (vide), `SESSION_DRIVER=database`.
- Requires MariaDB/MySQL local. Les tests utilisent une base de test Laravel standard.
- Jeu de données de démo : 186 élèves, 6 classes, 14 matières, 2 790 notes, 253 factures.

## Compte de démonstration

`direction@diallo.test` / `password`. Le client HTTP (`app/src/api.js`) ouvre
automatiquement la session de démo au premier lancement et stocke le token Sanctum
dans `localStorage` sous `arena.token` (+ `arena.user`).

## Résolution de l'URL de l'API

`app/src/api.js` choisit l'URL selon le contexte :

| Contexte | URL |
| --- | --- |
| Electron (`file://`) | `http://127.0.0.1:8001/api` |
| Navigation web | `http://<hostname>:8001/api` (hôte entre crochets si IPv6) |
| Override | `VITE_API_URL` dans `app/.env` |

## Dépannage

- **Le front ne trouve pas l'API** → API non démarrée sur 8001, ou `VITE_API_URL` erroné. Vérifier `curl http://127.0.0.1:8001/api/meta`.
- **401 partout** → token absent/expiré : `localStorage.removeItem('arena.token')` puis reconnexion avec le compte de démo.
- **Écrans figés au démarrage Electron** → `main.js` attend l'API locale ; vérifier la copie backend dans `~/.config/diallo-desktop/backend`.
- **Port occupé** → 5179 (Vite) et 8001 (Laravel) sont des constantes du projet : changer le port oblige à ajuster `api.js` et `dev.js`.
- **HMR ne fonctionne pas** → on a modifié `main.js`/`preload.js` : redémarrer Electron.
- **Tests API** : `cd api && composer test` ou `php artisan test` (passe `config:clear` avant).

## Précautions

- Ne pas commit de `.env`, de base réelle ni de token.
- Les données métier ne sont jamais en dur dans les écrans : voir le skill `react-ui`.
- Un changement de design token doit être propagé dans `app/src/styles.css` **et**
  `figma/diallo-indigo/tokens.json` : voir le skill `design-tokens`.
