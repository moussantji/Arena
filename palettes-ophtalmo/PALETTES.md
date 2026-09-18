# Oculis · Saphir & Ambre — thème unique de la clinique

> ✅ **Seul thème retenu** (au départ 3 propositions : Saphir & Ambre, Émeraude & Sable, Onyx & Iris — les 2 autres ont été retirées du repo).
> **PNG livrable** : `png/01-saphir-ambre-pc-mobile-final.png` — PC (Electron) + Mobile (React Native) en pleine taille, pilotage clinique (KPI, CA, agenda, file d'attente, facturation) + photo de la réception en fond
> Aperçu live : `index.html` — tokens cliquables (copie du hex) + mockups PC & mobile de l'écran Réception + export CSS 1-clic

## Identité

- **Nom** : Saphir & Ambre
- **Humeurs** : Précision · Confiance · Luxe sobre
- **Usage** : interface PC de gestion + écran de réception (palette de référence de toute la clinique)
- **Spécimens** : radius 14 px · sidebar 240 px · base 14 px · contraste AA

## Tokens

| Rôle | Hex | | Rôle | Hex |
|---|---|---|---|---|
| Fond | `#F3F6FB` | | Primaire | `#1E56D6` |
| Surface | `#FFFFFF` | | Primaire hover | `#1744AC` |
| Surface 2 | `#E9EFF8` | | Primaire soft | `#E2EAFC` |
| Bordure | `#D7E0EE` | | Accent (or) | `#C08A2D` |
| Texte 1 | `#0C1A30` | | Accent soft | `#F6ECDA` |
| Texte 2 | `#43536E` | | Succès | `#1F8A58` |
| Texte 3 | `#8492AB` | | Alerte | `#A86400` |
| Erreur | `#C13B3B` | | Sidebar | `#0C1A30` |
| Sidebar texte | `#B9C7E0` | | Dégradé | `linear-gradient(135deg, #1E56D6, #4F86FF)` |
| Radius | 14 / 18 px | | Ombre | `0 14px 34px rgba(12,26,48,.10)` |

## Fichiers de thème prêts à l'emploi

- **Electron (PC)** → `electron/oculis.theme.css` — variables CSS `--oc-*` + composants types (`.oc-card`, `.oc-btn-primary`, `.oc-chip`, `.oc-sidebar`)
- **React Native (mobile)** → `react-native/oculis.theme.js` — `import saphir from './oculis.theme'` (hex, radius, shadow, dégradé)

## Images

- `png/01-saphir-ambre-pc-mobile-final.png` — livrable final PC + Mobile (1440×1360)
- `png/01-saphir-ambre-pc-electron.png` / `png/01-saphir-ambre-mobile-react-native.png` — écrans individuels en grand
- `img/bg-clinique-bleue.jpg` — photo de la réception (bannière des écrans)
- `img/bg-texture-sombre.jpg` — texture imagerie (fond des maquettes)

## Régénérer les PNG (outillage)

`tools-shots/` : `node gen4.js` (livrable final) à partir de `mockups.js` (mockups PC 880×720 & mobile 380×860). Nécessite `fonts-ttf/` : recopier les WOFF `node_modules/@fontsource/{manrope,fraunces,jetbrains-mono}/files/*-latin-*.woff` dans `fonts/` puis `node convert-fonts.js`.
