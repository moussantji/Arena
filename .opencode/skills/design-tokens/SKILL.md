---
name: design-tokens
description: Tokens de design DIALLO (« Indigo Minuit ») et leurs trois miroirs à garder synchrones — app/src/styles.css (:root), figma/diallo-indigo/tokens.json, figma/diallo-indigo/code.js (constante C). À utiliser pour changer une couleur, un rayon, un espacement, une typo, un effet, ou quand un écran Figma/Sketch diverge du web. Exemples : « la couleur ne matche pas », « token », « palette », « dark theme ».
---

# Design tokens — « Indigo Minuit »

Une seule direction visuelle : fond indigo profond, texte clair, **un seul accent**
(`#5B7CFA`), cuivre pour l'argent, rouge doux pour le risque.

## Les trois miroirs (obligatoire de les mettre à jour ensemble)

| Miroir | Où | Forme |
|---|---|---|
| Web | `app/src/styles.css` → `:root` | variables CSS (`--bg`, `--accent`, `--r`…) |
| Plugin Figma | `figma/diallo-indigo/code.js` → `const C` (l. 8) | palette hex → `TOKENS` (l. 190) crée les styles `DIALLO/<nom>` |
| Tokens JSON | `figma/diallo-indigo/tokens.json` | format W3C Design Tokens, groupe `color`/`radius`/`space`/`font`/`effect` |

⚠️ `code.js` **ne lit pas** `tokens.json` : la palette est recopiée dans `C`. Une couleur
changée dans un seul endroit fait diverger le web, le plugin et le `.sketch`.

Map complète des correspondances : `references/token-map.md`.

## Tokens CSS (`styles.css :root`)

```
--bg #070b1f      fond application
--bg2 #0b1030     surface élevée
--panel rgba(27,42,107,.28)   panneau     / --panel2 rgba(27,42,107,.42)
--glass rgba(240,242,255,.06)  voile
--ink #f0f2ff     texte principal
--dim #a7b6ff     texte secondaire
--faint #6b78a8   texte tertiaire / labels
--line rgba(167,182,255,.15)  / --line-strong rgba(167,182,255,.28)
--accent #5b7cfa  seul accent   --accent2 #7e9bff  hover / dégradé
--copper #e0a86f  finance, argent
--danger #f08a8a  risque
--glow rgba(91,124,250,.42)    halo d'ombre
--r 14px          rayon standard
--sidebar 238px   --titlebar 54px   --topbar 56px
--ease cubic-bezier(.22,.8,.22,1)
```

`success #6FD3A8` existe côté Figma (`C.success`, `tokens.json` `color.success`) mais n'a pas
de variable CSS : le web exprime les états OK via `.pill.ok` et les classes de composants.

## Rayons, espacements, typo

- Rayons (`tokens.json`) : `sm 7`, `md 10`, `lg 14` (= `--r`), `xl 18`, `pill 999`.
- Espacements : échelle `1 4`, `2 8`, `3 12`, `4 16`, `5 20`, `6 28`, `7 40`.
- Typo : familles `Inter` + `JetBrains Mono` ; tailles `display 28`, `title 20`, `heading 15`,
  `body 12`, `caption 10`, `label 9`. Le web utilise des `px` equivalents dans `styles.css`.
- Effets : `glow` (#5B7CFA6B, blur 40, spread -14) et `card` (#000000CC, y 24, blur 60, spread -46).

## Règles d'usage

- Dans un composant ou une feuille de style : `var(--token)`, jamais un hex cru. Un hex neuf
  dans une page = signal d'un token manquant → ajouter la variable dans `:root`.
- Opacité de panneau : préférer `--panel`/`--panel2`/`--glass` aux `rgba()` recopiés.
- L'accent est **unique** : ne pas introduire un second accent coloré pour un état.
  Les états se distinguent par `--copper` (argent), `--danger` (risque) et les classes
  `.pill.ok|.warn|.danger|.muted|.accent`.
- Ne pas créer de thème clair ni de variante parallèle : la direction est unique et assumée.

## Quand on modifie un token

1. `app/src/styles.css` `:root` (+ les classes qui l'utilisaient en dur).
2. `figma/diallo-indigo/code.js` `C` et `TOKENS` (nom + description du style).
3. `figma/diallo-indigo/tokens.json` (valeur hex sans alpha pour `color`, ou l'entrée
   `effect`/`radius`/`space`/`font` concernée).
4. Si une capture `.sketch` existe : régénérer (`node tools/figma-mock.js && python3
   tools/make-figma-sketch.py`) — voir le skill `figma-sketch`.

Pour lister les valeurs en dur qui contournent les tokens côté web :

```bash
grep -rn "#[0-9a-fA-F]\{6\}" app/src/pages app/src/ui.jsx app/src/forms.jsx app/src/layout.jsx
```
