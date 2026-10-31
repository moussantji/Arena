---
name: figma-sketch
description: Chaîne Figma/Sketch de DIALLO — plugin figma/diallo-indigo/ (code.js, manifest.json) et génération du fichier importable figma/DIALLO-Indigo-Minuit.sketch via tools/figma-mock.js et tools/make-figma-sketch.py. À utiliser pour « écran Figma », « le .sketch », « importer dans Figma », « artboard », « le plugin ne génère pas la page », « design system Figma ». Exemples : « ajoute la page Matières au .sketch », « Figma ne matche pas l'app ».
---
# Design Figma / Sketch — `figma/` + `tools/`

Deux artefacts, **une seule source de vérité** : `figma/diallo-indigo/code.js`.

| Artefact | Comment il est produit |
|---|---|
| Plugin Figma (`figma/diallo-indigo/`) | Importé dans Figma via `manifest.json`, lance `code.js` |
| `figma/DIALLO-Indigo-Minuit.sketch` | `tools/figma-mock.js` rejoue `code.js` → `tools/scene.json` → `tools/make-figma-sketch.py` |

Le `.sketch` est le **pivot d'import** (Figma importe Sketch nativement ; `.fig` est propriétaire).
Il est généré à partir du même code que le plugin : jamais de capture d'écran, jamais de bitmap
pour un écran — les calques sont réels (groupes nommés, vecteurs, texte Inter éditable).

## Régénérer le `.sketch` (nécessite Node + Pillow)

```bash
node tools/figma-mock.js                # défaut build-screens → tools/scene.json
python3 tools/make-figma-sketch.py      # scene.json → figma/DIALLO-Indigo-Minuit.sketch
```

Commandes du plugin (`manifest.json`, id `diallo-indigo-minuit-generator`,
`documentAccess: dynamic-page`) : `build-all`, `build-styles`, `build-screens`.
`node tools/figma-mock.js <command>` accepte la même commande.

## Valider avant de diffuser

```bash
python3 tools/check-sketch.py figma/DIALLO-Indigo-Minuit.sketch      # structure : pages, IDs uniques, artboards dimensionnés
python3 tools/validate-sketch.py figma/DIALLO-Indigo-Minuit.sketch   # schéma officiel @sketch-hq/sketch-file-format v6.5.0
```

`validate-sketch.py` exige `jsonschema` et le schéma officiel (cache `~/.cache/diallo-sketch-schemas`,
override `SKETCH_SCHEMAS=/chemin/dist`). Un `.sketch` qui passe `check-sketch.py` mais échoue à
`validate-sketch.py` est **cassé pour Figma** : ne pas le diffuser.

## Ajouter / modifier un écran

1. Écrire la fonction `screenXxx(dsPage)` dans `figma/diallo-indigo/code.js`.
2. L'ajouter à la liste `SCREENS` (l. ~1366) — c'est cette liste qui pilote le plugin **et** le `.sketch`.
3. Reporter les valeurs dans `TOKENS` / `TYPE` si le style change (skill `design-tokens`).
4. Régénérer le `.sketch` puis valider.

Un écran ajouté dans l'app React (`app/src/pages/…`) sans entrée dans `SCREENS` n'apparaît ni dans le
plugin ni dans le `.sketch` : la divergence page-React / page-Figma est le bug classique.

## Ce que contient le `.sketch` aujourd'hui

- Page `01 · Écrans` — 14 artboards 1440 × 900 : Tableau de bord, Élèves, Classes, Matières,
  Emploi du temps, Finances, Personnel, Messagerie, Notes, Absences, Fiche élève, Admissions,
  Paramètres, Modales.
- Page `02 · Design system` — 1 artboard « Indigo Minuit · palette, type, composants »
  (12 nuances nommées + HEX, 8 styles Inter, composants vectoriels), alimenté aussi par
  `gallery/palettes` pour la couverture du design system.
- 15 artboards au total, 0 image référencée dans les écrans.

`figma/README.md` annonce « 13 artboards » : il est en retard sur le fichier. Mettre le README à
jour en même temps que le `.sketch` (il est le mode d'emploi lu par un humain qui importe le fichier).

## Divergences assumées (ne pas "corriger")

- Noms de pages : le plugin crée `01 · Design system · DIALLO` + `02 · Composants`, le `.sketch`
  a `01 · Écrans` + `02 · Design system`. `make-figma-sketch.py` sélectionne la page dont le nom
  commence par `01` et ne garde que les frames 1440 × 900.
- `code.js` ne lit **pas** `tokens.json` : la palette est la constante `C` en tête de fichier.
  Les trois miroirs (CSS, `tokens.json`, `C`) sont à synchroniser à la main — voir `design-tokens`.

## Valeurs à garder synchro avec `app/src/styles.css`

Fenêtre 1440 × 900 · sidebar 238 · topbar 54 · rayon carte 14 · rayon modale 18 · modale large 760 ·
drawer 440 · filet 1 px `#A7B6FF` à 14 % · accent `#5B7CFA` · Inter (Regular/Medium/Semi Bold/Bold).

## Avant de conclure

```bash
node tools/figma-mock.js && python3 tools/make-figma-sketch.py
python3 tools/check-sketch.py figma/DIALLO-Indigo-Minuit.sketch
python3 tools/validate-sketch.py figma/DIALLO-Indigo-Minuit.sketch
```

Format de `scene.json` et pièges de conversion : `references/scene-format.md`.
