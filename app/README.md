# Kalanso — interface React

Interface desktop de gestion d'école, direction **Indigo Minuit**.
L'application est branchée sur l'API Laravel (`api/`) : données réelles,
authentification Sanctum, permissions par rôle, exports Excel et rapports
imprimables. Aucun compte ni aucune donnée de démonstration n'est embarqué.

## Lancer

```bash
cd app
npm install
npm run dev      # http://localhost:5179
npm run build    # bundle de production dans dist/
```

L'API locale doit écouter sur `http://127.0.0.1:8001/api` (voir `api/README.md`).
Sur une base vide, l'interface affiche l'écran de première configuration, puis
l'écran de connexion (mot de passe ou Google dans l'application desktop).

## Structure

```
app/
├─ index.html
├─ vite.config.js
└─ src/
   ├─ main.jsx            point d'entrée
   ├─ App.jsx             coquille : configuration, connexion, navigation
   ├─ setup.jsx           première configuration (établissement + compte Direction)
   ├─ login.jsx           connexion mot de passe et Google
   ├─ api.js              client HTTP (token Sanctum, session, setup, Google)
   ├─ data.jsx            contexte partagé : méta, permissions, notifications, toasts
   ├─ auth.js             rôles, permissions et pages autorisées
   ├─ layout.jsx          TitleBar · Sidebar · TopBar (+ NAV)
   ├─ ui.jsx              atomes et molécules d'affichage
   ├─ pages.jsx / pages/  écrans métier
   ├─ forms.jsx           formulaires, listes et confirmations
   ├─ actions.jsx         actions métier partagées
   ├─ reports.js          rapports imprimables
   ├─ exports.js          exports Excel métier
   ├─ modal.jsx           système de modales (pile, focus, animations)
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
| `Field`, `Toggle` | champs et interrupteurs |

### `modal.jsx` — modales

`ModalProvider`, `useModal()` (`open`, `close`, `closeAll`, `stack`) et
`useModals()` (ouvreurs prêts : `student()`, `payment()`, `confirm()`,
`absence()`, `exportData()`, `drawer()`, `message()`, `success()`).

Comportement : pile, focus piégé, fermeture par `Échap` ou clic sur le voile,
animations d'entrée/sortie, verrou de scroll et attributs d'accessibilité.

### `App.jsx` — navigation

- Écran de première configuration quand la base est vide
- Connexion mot de passe ou Google (desktop)
- État local `pageId`, transitions directionnelles
- Recherche de page, notifications et visite guidée
- Filtrage des pages et actions selon le rôle de l'utilisateur
- Deep-link par hash : `#finances`, `#emploi-du-temps`, …

## Icône et logo

L'icône par défaut est `src/assets/kalanso-icon.png` (source vectorielle
`../gallery/electron/build/icon.svg`). Le logo de l'établissement, téléversé
depuis **Paramètres → Établissement**, remplace automatiquement l'icône par
défaut dans la barre latérale, l'écran de connexion et les paramètres.

## Ajouter une page

1. Écrire le composant dans `src/pages/` et l'ajouter à `META` + `PAGES`.
2. Ajouter une entrée dans `NAV` (`layout.jsx`) avec une icône de `ui.jsx`.
3. Déclarer la page dans `ROLE_PAGES` (`auth.js`) pour les rôles autorisés.
