# DIALLO — école premium

Direction artistique et maquettes d'une application de gestion d'école.
Palette retenue : **Indigo Minuit** (`#070B1F` · `#5B7CFA` · `#E0A86F`).

## Contenu

| Dossier | Contenu |
|---|---|
| `app/` | **Dashboard React** — interface desktop, composants, affichage uniquement |
| `figma/` | **Plugin Figma** qui génère les styles, composants et écrans + tokens |
| `gallery/` | Écrans d'accueil (exports PNG) et coquille Electron |

## Démarrer

```bash
# interface React
cd app && npm install && npm run dev      # http://localhost:5179

# coquille Electron (écrans exportés)
cd gallery/electron && npm install && npm start

# galerie statique des écrans
node gallery/server.js 4173
```

## Figma

Voir `figma/README.md` : importer `figma/diallo-indigo/manifest.json` comme plugin
de développement, puis **Plugins → Development → DIALLO — Indigo Minuit**.

## Écrans

Écrans React (composants) : tableau de bord, élèves, classes, emploi du temps,
finances, personnel, messagerie, notes, absences, fiche élève, admissions, paramètres.

Écrans exportés (PNG, 1312 × 816) : `gallery/palettes/indigo-page-*.png`
+ bannière `hero-06-indigo-minuit.png` et planche `palette-3-indigo-minuit.png`.

## Conventions

- Une seule direction visuelle : **Indigo Minuit**, un accent unique.
- Aucune logique métier dans l'interface : les données viennent de `app/src/mock.js`.
- Tokens centralisés dans `app/src/styles.css` (variables CSS) et `figma/diallo-indigo/tokens.json`.
