# DIALLO — dashboard React (affichage uniquement)

Interface desktop de gestion d'école, direction **Indigo Minuit**.
**Aucune logique métier** : pas d'appel réseau, pas de base de données, pas de calcul.
Tout le contenu vient de `src/mock.js` — les composants ne font que le mettre en page.

## Lancer

```bash
cd app
npm install
npm run dev      # http://localhost:5179
npm run build    # bundle de production dans dist/
```

## Structure

```
app/
├─ index.html
├─ vite.config.js
└─ src/
   ├─ main.jsx            point d'entrée
   ├─ App.jsx             coquille : état de navigation, transitions, raccourcis
   ├─ layout.jsx          TitleBar · Sidebar · TopBar · PageHeader (+ NAV)
   ├─ ui.jsx              atomes et molécules d'affichage
   ├─ pages.jsx           les 12 écrans
   ├─ mock.js             tokens + données statiques
   └─ styles.css          feuille de style unique (CSS variables)
```

### `ui.jsx` — composants

| Composant | Rôle |
|---|---|
| `Icon` | jeu d'icônes SVG (trait 1,6 px) |
| `Avatar`, `Pill`, `Btn`, `IconBtn`, `Tabs`, `Stat`, `Divider` | atomes |
| `Card`, `CardHead`, `SectionTitle` | conteneurs verre |
| `Kpi` | carte indicateur (delta, jauge, sparkline) |
| `Progress` | jauge fine animée |
| `Sparkline`, `AreaChart`, `BarChart`, `Donut`, `HBarList` | graphiques SVG animés en CSS |
| `Table`, `Tr` | tableau en CSS grid |
| `Field`, `Toggle` | champs et interrupteurs (présentation) |

### `pages.jsx` — écrans

`Dashboard`, `Eleves`, `Classes`, `EmploiDuTemps`, `Finances`, `Personnel`,
`Messagerie`, `Notes`, `Absences`, `Fiche`, `Admissions`, `Parametres`.

Chaque page exporte aussi ses métadonnées dans `META` (titre, sous-titre, fil d'Ariane, actions).

### `App.jsx` — navigation

- état local `pageId`, transitions directionnelles (`slide-next` / `slide-prev`)
- recherche de page + notifications (affichage)
- visite guidée automatique (`T`), dock précédent/suivant
- raccourcis : `←/→`, `1…9`, `0`, `⌘K`, `T`
- deep-link par hash : `#finances`, `#emploi-du-temps`, …

## Ajouter une page

1. Écrire le composant dans `pages.jsx` et l'ajouter à `META` + `PAGES`.
2. Ajouter une entrée dans `NAV` (`layout.jsx`) avec une icône de `ui.jsx`.

Aucune autre modification : la navigation, le dock et le compteur se mettent à jour seuls.

## Design tokens

| Token | Valeur |
|---|---|
| Fond | `#070B1F` |
| Surface élevée | `#0B1030` |
| Panneau verre | `#1B2A6B` (28–42 %) |
| Texte | `#F0F2FF` / `#A7B6FF` / `#6B78A8` |
| Accent | `#5B7CFA` · clair `#7E9BFF` |
| Cuivre | `#E0A86F` |
| Rayons | 7 · 10 · 14 · 18 px · pilule |
