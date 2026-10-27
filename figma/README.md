# Figma — DIALLO · Indigo Minuit

## 0. Le plus simple : un fichier à importer

**`figma/DIALLO-Indigo-Minuit.sketch`** — c'est le fichier à glisser dans Figma.

1. Figma → **File → Import…** (ou glisser le fichier sur le canvas)
2. Choisir `DIALLO-Indigo-Minuit.sketch`

Figma importe les fichiers Sketch nativement ; le `.fig` étant un format binaire
propriétaire, `.sketch` est le format pivot. Contenu du fichier (2 pages, 13 artboards) :

| Page | Contenu |
|---|---|
| `01 · Écrans` | 12 écrans desktop 1440 × 900 : Tableau de bord, Élèves, Classes, Emploi du temps, Finances, Personnel, Messagerie, Notes, Absences, Fiche élève, Admissions, Paramètres |
| `02 · Design system` | palette Indigo Minuit (12 nuances nommées + HEX), 8 styles typographiques Inter, composants vectoriels : boutons, pills de statut, carte KPI, avatar, ligne de tableau |

Vérifications avant diffusion :

```bash
python3 tools/check-sketch.py figma/DIALLO-Indigo-Minuit.sketch      # structure
python3 tools/validate-sketch.py figma/DIALLO-Indigo-Minuit.sketch   # schéma Sketch officiel
```

Régénération : `python3 tools/make-figma-sketch.py` (nécessite Pillow).

---

## Alternative : le plugin Sketch


## 1. Importer le plugin (variante)

1. Ouvrir Figma (desktop ou web) → **Plugins → Development → Import plugin from manifest…**
2. Choisir `figma/diallo-indigo/manifest.json`
3. Dans un fichier vide, lancer **Plugins → Development → DIALLO — Indigo Minuit**

Trois commandes sont disponibles :

| Commande | Effet |
|---|---|
| **Générer le design system + les écrans** | styles + composants + 10 écrans |
| Générer uniquement les styles | 12 couleurs, 8 typographies, 2 effets |
| Générer uniquement les écrans | board palette/typo + 10 écrans 1440 × 900 |

## 2. Ce que crée le plugin

**Page `01 · Design system · DIALLO`**
- board « Indigo Minuit » : 12 nuances avec noms et hex, échelle typographique complète
- écrans 1440 × 900 (Electron) : `Tableau de bord`, `Élèves`, `Classes`, `Emploi du temps`,
  `Finances`, `Notes`, `Admissions`, `Fiche élève`, `Paramètres`
- **`Modales`** : le tableau de bord voilé avec une modale « Nouvel élève » par-dessus
  (voile 68 %, panneau 760 px, entête, sections, champs, pied Annuler / Créer)
- chaque écran est composé de vrais calques : sidebar, topbar, cartes, KPI, tableaux, grille horaire

**Page `02 · Composants`**
- `Button / Primaire`, `Button / Secondaire`
- `Pill / À jour`, `En retard`, `Boursier`, `Payé`
- `Avatar / MD`, `AT`, `IK`
- `KPI / Default`
- `Table / Row`

**Styles**
- `DIALLO/bg`, `bg-elevated`, `panel`, `ink`, `dim`, `faint`, `line`, `accent`, `accent-soft`, `copper`, `danger`, `success`
- `DIALLO/Display / 28`, `Title / 20`, `Heading / 15`, `Body / 12`, `Body strong / 12`, `Caption / 10.5`, `Label / 9`, `Mono / 10`
- `DIALLO/Glow accent`, `DIALLO/Card shadow`

## 3. Tokens (alternative / Tokens Studio)

`diallo-indigo/tokens.json` est au format **Tokens Studio** (W3C compatible) :
couleurs, rayons, espacements, typographies et ombres.
À importer avec le plugin *Tokens Studio for Figma* si vous préférez piloter les
styles par tokens plutôt que par le générateur.

## 4. Rester synchro avec le code

Les écrans générés utilisent exactement les valeurs de `app/src/styles.css` :

| Élément | Valeur |
|---|---|
| Fenêtre | 1440 × 900 |
| Sidebar | 238 px |
| Topbar | 54 px |
| Rayon carte | 14 px |
| Rayon modale | 18 px |
| Modale large | 760 px |
| Drawer | 440 px |
| Filet | 1 px, `#A7B6FF` à 14 % |
| Accent | `#5B7CFA` |
| Police | Inter (Regular / Medium / Semi Bold / Bold) |

Après une modification de la palette dans `app/src/styles.css`, reporter les
valeurs dans `TOKENS` / `TYPE` (`figma/diallo-indigo/code.js`) puis relancer le
plugin : les styles sont recréés à l'identique.
