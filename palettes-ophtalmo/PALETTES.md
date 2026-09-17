# Oculis · 3 palettes ultra-premium — Gestion clinique ophtalmo & Réception

> Aperçu live : `index.html` (tokens cliquables + mockups PC & mobile de l'écran Réception)
> PNG haut de gamme : dossier `png/` (1 par palette × PC Electron / Mobile React Native + comparatif)

## Fichiers de thème prêts à l'emploi

- **Electron (PC)** → `electron/oculis.theme.css` — variables CSS, commutation `<html data-theme="saphir|emeraude|onyx">`
- **React Native (mobile)** → `react-native/oculis.theme.js` — `import { saphir, emeraude, onyx } from './oculis.theme'`, hex + radius + shadow + dégradés

## 01 · Saphir & Ambre — *Précision · Confiance · Luxe sobre*
Recommandation : interface PC de gestion + écran de réception (palette de référence).

| Rôle | Hex | | Rôle | Hex |
|---|---|---|---|---|
| Fond | `#F3F6FB` | | Primaire | `#1E56D6` |
| Surface | `#FFFFFF` | | Primaire hover | `#1744AC` |
| Surface 2 | `#E9EFF8` | | Primaire soft | `#E2EAFC` |
| Bordure | `#D7E0EE` | | Accent or | `#C08A2D` |
| Texte 1 | `#0C1A30` | | Accent soft | `#F6ECDA` |
| Texte 2 | `#43536E` | | Succès / soft | `#1F8A58` / `#DFF3E8` |
| Texte 3 | `#8492AB` | | Alerte / soft | `#A86400` / `#FAEDD7` |
| Sidebar PC | `#0C1A30` | | Erreur / soft | `#C13B3B` / `#FAE4E4` |
| Dégradé | `#1E56D6 → #4F86FF` | | | |

- **PC** : sidebar 240px encre marine, item actif pastille saphir + point or, cards radius 12–14px, bordures hairline `#D7E0EE`, ombre douce 14px/10 %, base 14px.
- **Mobile** : bottom nav blanc 56px (item actif saphir + point), hero dégradé saphir radius 18px, boutons blancs 92 %, cibles tactiles ≥ 44px, chips d'état en soft pour lecture à 2 m.

## 02 · Émeraude & Sable — *Apaisement · Nature · Prestige*
Idéal : espace patient & bilans, cliniques premium, suivi cataracte / post-op.

| Rôle | Hex | | Rôle | Hex |
|---|---|---|---|---|
| Fond | `#F5F3EC` | | Primaire | `#0F6B52` |
| Surface | `#FFFFFF` | | Primaire hover | `#0B5540` |
| Surface 2 | `#EFECE1` | | Primaire soft | `#DFF0E8` |
| Bordure | `#E0DBCB` | | Accent cuivre | `#B0702A` |
| Texte 1 | `#13251E` | | Accent soft | `#F5E9D6` |
| Texte 2 | `#48584F` | | Succès / soft | `#2F7D4E` / `#E3F1E7` |
| Texte 3 | `#8A948C` | | Alerte / soft | `#A26605` / `#F6EDD8` |
| Sidebar PC | `#10221B` | | Erreur / soft | `#B23F2C` / `#F7E5E0` |
| Dégradé | `#0F6B52 → #37A37F` | | | |

- **PC** : sidebar 240px pin forêt, item actif émeraude + point cuivre, fond crème, cuivre en accent ≤ 5 % (points actifs, badges dossier, facturation).
- **Mobile** : bottom nav crème + hairline sable, hero dégradé émeraude + halo blanc 14 %, pastilles d'actions soft émeraude ; tablette paysage pour la file d'attente, portrait pour le check-in.

## 03 · Onyx & Iris — *Technologie · Nuit · Signature*
Signature : mode sombre, salle d'imagerie OCT / fond d'œil, app patient premium.

| Rôle | Hex | | Rôle | Hex |
|---|---|---|---|---|
| Fond | `#0B0D13` | | Primaire iris | `#7B5CF6` |
| Surface | `#141824` | | Primaire hover | `#9377FF` |
| Surface 2 | `#1C2130` | | Primaire soft | `#292349` |
| Bordure | `#272E42` | | Accent abricot | `#FF9E6D` |
| Texte 1 | `#F1F3FA` | | Accent soft | `#3B2B21` |
| Texte 2 | `#A7AEC6` | | Succès / soft | `#34D399` / `#123227` |
| Texte 3 | `#6E7592` | | Alerte / soft | `#F5B62E` / `#352B10` |
| Sidebar PC | `#0E1119` | | Erreur / soft | `#F0716B` / `#3A1E1E` |
| Dégradé | `#7B5CF6 → #B18CFF` | | | |

- **PC** : 3 niveaux de surface (jamais de noir pur), bordures `#272E42`, item actif pastille iris + lueur douce + point abricot, texte blanc max 90 % (anti-éblouissement), profondeur par ombres 40 %.
- **Mobile** : bottom nav « pillule glass » (blur 10 px, `#141824` 92 %), hero dégradé iris radius 18px, états neon-doux (pastilles sombres + texte vif), usage main courante pour le check-in.

---
*Contraste : texte principal ≥ 12:1 sur fond dans les 3 palettes ; états toujours en duo « soft + saturé » pour rester accessibles.*
