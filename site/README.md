# Site IPFS-BK — Institut Bernard Kouchner

Site vitrine React de l'**Institut Privé de Formation Sanitaire Bernard Kouchner**
(IPFS-BK), Hippodrome 1, Bamako — Mali. Application monopage (Vite + React 19 +
React Router), sans backend : toutes les données sont statiques, dans
`src/data/content.js`.

```bash
cd site
npm install
npm run dev        # http://localhost:5180
npm run build      # build de production dans site/dist
npm run shots      # captures d'écran (nécessite Chromium et un runner Linux)
```

### Captures d'écran (aperçu)

Le rendu visuel est automatisé : `scripts/shots.mjs` parcourt les pages et écrit
les PNG dans `site/shots/`. Sur une machine disposant des bibliothèques système de
Chromium (`npx playwright install --with-deps chromium`) :

```bash
npm run build
npx vite preview --port 5180 &
npm run shots
```

Le même script peut servir de job CI (runner `ubuntu-latest`) : il suffit
d'ajouter un workflow qui exécute `npm ci`, `npx playwright install --with-deps
chromium`, `npm run build`, puis `npm run shots` et publie `site/shots` en
artefact.

## Pages

| Route | Contenu |
|---|---|
| `/` | Accueil : hero, engagement, admission en 3 étapes, programmes, valeurs, témoignages, blog, galerie, app mobile, CTA |
| `/formations` | Catalogue des 14 formations avec filtres (catégorie, niveau, mode) et recherche |
| `/formations/:slug` | Fiche formation : programme, conditions d'accès, dossier, débouchés, tarif BNDA |
| `/blog` | Blog / actualités : vidéo à la une, articles mis en avant, recherche, galerie, newsletter |
| `/blog/:slug` | Article complet avec sidebar |
| `/application` | Présentation de l'application mobile (écrans interactifs, QR code, stores) |
| `/a-propos` | Histoire, agréments, valeurs, piliers, équipe, localisation |
| `/admission` | Dossier d'inscription en 4 étapes, bourses, agenda, FAQ |
| `/contact` | Formulaire, coordonnées, accès |
| `/espace/connexion` | Connexion 3 profils : personnel, étudiant, parent |
| `/personnel` | **Version PC** (réservée au personnel connecté) : tableau de bord, élèves, classes, notes, scolarité, absences, emploi du temps, admissions, messagerie, documents, paramètres |
| `/espace` | Espace étudiant / parent (notes, scolarité, notifications) |

## Accès personnel (démonstration)

| E-mail | Mot de passe | Rôle |
|---|---|---|
| `direction@ipfs-bk.ml` | `direction2026` | Direction des Études |
| `staff@ipfs-bk.ml` | `staff2026` | Personnel — Scolarité |

Dès qu'un membre du personnel se connecte, le site bascule automatiquement sur
l'interface de bureau (`/personnel`), comme demandé. La session est conservée dans
`localStorage` (`ipfsbk.session.v1`) ; la déconnexion est disponible dans la barre
latérale.

## Données

`src/data/content.js` reprend les informations publiques du site officiel
[institut-bernard-kouchner.com](https://institut-bernard-kouchner.com/) :
les 14 formations (niveaux, durées, tarifs), les 11 actualités, les témoignages,
l'équipe d'administration, les références officielles (Décision n°2023-000211,
Arrêté n°2026-0401), le compte BNDA `490001201401`, l'adresse Hippodrome 1 et les
téléphones `+223 76 74 74 07` / `+223 83 01 02 02`.

Les photographies de `public/img` sont des visuels générés pour l'identité du site
(ils ne proviennent pas du site officiel, dont les images ne sont pas librement
réutilisables).

## Direction artistique

Palette « Émeraude & Or » : encre `#04130f`, émeraude `#0f6f52`, jade `#2fc79a`,
or `#d9b26a`, crème `#fbf8f2`. Typographies **Fraunces** (titres éditoriaux) et
**Manrope** (texte), toutes deux embarquées via Fontsource.
