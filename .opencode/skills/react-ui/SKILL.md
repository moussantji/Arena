---
name: react-ui
description: Conventions du front React de DIALLO dans app/ — registre de pages (PAGES/META/NAV), shell desktop, primitives UI, données via useApi, styles centralisés. À utiliser pour créer ou modifier une page, un écran, un composant, un tableau, un filtre, une modale. Exemples : « nouvelle page », « ajouter un écran », « le tableau est vide », « données en dur ».
---

# Front React — `app/`

React 19 + Vite, **une seule feuille de style** (`src/styles.css`), **aucune librairie UI**
(react/react-dom + pptxgenjs uniquement). Tout composant est écrit dans le projet.

| Fichier | Rôle |
|---|---|
| `src/main.jsx` | Provider order : `DataProvider` → `ModalProvider` → `App` |
| `src/App.jsx` | Shell : `TitleBar`, `Sidebar`, `TopBar`, routeur `#<pageId>`, `ModalRoot`, `Toaster` |
| `src/layout.jsx` | `NAV` (groupes sidebar) + `PAGES = Object.values(NAV).flat()` + `Sidebar`/`TopBar`/`TitleBar`/`PageHeader` |
| `src/pages.jsx` | Registre `PAGES` (`id` → composant) + réexports |
| `src/pages/meta.js` | `META[id]` : `label`, `group`, `crumb`, `title`, `sub`, `primary`, `secondary` |
| `src/pages/common.jsx` | `PageHead`, `StudentCell`, `StatusPill`, `Cell`, `Bar`, `DotRow`, `average` |
| `src/forms.jsx` | `SearchInput`, `SelectFilter`, `Pager`, `Field`, `openResourceForm`, `openConfirm`, `exportCsv`, `ActionMenu`, `ListState` |
| `src/ui.jsx` | Primitives : `Icon`, `Avatar`, `Pill`, `Btn`, `IconBtn`, `Card`/`CardHead`, `SectionTitle`, `Progress`, `Toggle`, `Tabs`, `Stat`, `Kpi`, `Sparkline`, `AreaChart`, `BarChart`, `Donut`, `HBarList`, `Table`/`Tr` |
| `src/data.jsx` | `DataProvider`, `useData` (meta globale), `useApi`, `useDebounced`, `money`, `number`, `fullName`, `dateInput`, constantes de statut |
| `src/api.js` | Client HTTP : auth, auto-login démo, retry 401, normalisation des URLs de fichiers |
| `src/styles.css` | Tokens CSS centralisés + toutes les classes |

## Règle n° 1 : aucune donnée business en dur

Les écrans affichent **ce que l'API renvoie**. Ni liste d'élèves, ni classes, ni montants,
ni nom d'école, ni taux. Un écran de démonstration qui marche sans backend est un bug.

Pour vérifier qu'un écran respecte cette règle, avec le backend arrêté (le shell doit montrer
une erreur et un bouton *Réessayer*, jamais des chiffres inventés) :

```bash
grep -rn "'FCFA'\|'Institution\|'M1\|'M2\|'Terminale\|'boursier'" app/src/pages/ | grep -v "meta.js"
```

Les constantes acceptées sont des **libellés de statut** (`STUDENT_STATUS`, `PAYMENT_STATUS`,
`STAFF_ROLES`, `ROOM_TYPES`…) dans `data.jsx`, jamais des valeurs métier.

## Checklist d'une nouvelle page

1. `src/pages/<id>.jsx` — composant, export nommé, préfixe `aria-label="Vue "`.
2. `src/pages/meta.js` — ajouter `META[id]` (`label`, `group`, `crumb`, `title`, `sub`, `primary`).
3. `src/layout.jsx` — ajouter l'entrée dans le groupe `NAV` concerné.
4. `src/pages.jsx` — importer et ajouter à `PAGES`.

`NAV` et `PAGES` doivent rester cohérents : la sidebar, le `TopBar` et le routeur en dépendent.

## Pattern d'un écran listé (référence : `pages/students.jsx`)

```jsx
export function Eleves() {
  const { meta } = useData();
  const actions = useActions();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const debounced = useDebounced(q);

  useEffect(() => { setPage(1); }, [debounced]);

  const query = { per_page: 12, page, q: debounced || undefined };
  const { data, loading, error, reload } = useApi('/students', query);
  const rows = data?.data || [];
  const total = data?.total || 0;
  const currency = meta?.school?.currency || 'FCFA';

  return (
    <>
      <PageHead title={meta.title} sub={meta.sub}>
        <SearchInput value={q} onChange={setQ} placeholder="Rechercher…" />
        <Btn icon="download" onClick={exportRows}>Exporter CSV</Btn>
      </PageHead>
      <ListState loading={loading} error={error} rows={rows} onRetry={reload}>
        <Table cols={[…]} head={[…]}>
          {rows.map((row) => <Tr key={row.id}>…</Tr>)}
        </Table>
        <Pager page={page} total={total} perPage={12} onPage={setPage} />
      </ListState>
    </>
  );
}
```

- `useApi(path, query, { silent, enabled })` → `{ data, loading, error, reload, rows }`.
  `rows` applique les clés de repli (`data`, `students`, `staff`, `subjects`, `classes`, `slots`) :
  les endpoints sans pagination répondent un array brut.
- Le `version` global de `useData()` déclenche le rafraîchissement de toutes les listes.
- Erreur : `ApiError.firstError` → `notify(msg, { tone: 'danger' })`. Ne jamais afficher un
  message d'erreur brut non traduit.
- Actions : `useActions()` expose `act(path, method, body)` pour les PATCH/POST inline ;
  les formulaires passent par `openResourceForm()` / `openConfirm()`, pas par `window.confirm`.
- Filtres : envoyer `undefined` (jamais `''`) pour un filtre inactif — le backend Laravel
  ignore les valeurs vides via `when()`.

## Composants

- Réutiliser les primitives de `ui.jsx` et les cellules de `pages/common.jsx` plutôt que
  recréer du markup. Un nouveau composant partagé se place dans `ui.jsx` (général) ou
  `common.jsx` (métier), jamais dans une page.
- Icônes : seulement les clés existantes de `ICONS` dans `ui.jsx` ; ajouter un path SVG dans
  `ICONS` si nécessaire, ne pas inline un SVG dans une page.
- Formatage : `money()`, `number()`, `dateInput()`, `fullName()`, `average()` — jamais
  `toLocaleString()` maison.
- Modales : `useModal().open({ title, body, footer, size })` via `ModalRoot`.

## Styles

- Classes existantes dans `styles.css` : `.card`, `.card-head`, `.btn` (`.primary`, `.ghost`,
  `.danger`, `.sm`, `.icon`), `.pill` (`.ok`, `.warn`, `.danger`, `.muted`, `.accent`),
  `.grid-cols`, `.section-title`, `.boot-screen`, `.tr`, `.field`.
- Couleurs, rayons, spacing, typo : **tokens uniquement** (`var(--bg)`, `--ink`, `--dim`,
  `--faint`, `--line`, `--accent`, `--copper`, `--danger`, `--r`, `--ease`) — voir le skill
  `design-tokens`. Aucune valeur hexadécimale nouvelle dans un composant.
- Une nouvelle classe se déclare dans `styles.css`, pas dans un fichier de page.

## Shell desktop

- `App.jsx` est aussi chargé dans Electron : ne pas utiliser les contrôles de fenêtre du
  navigateur. Le `TitleBar` appelle `window.desktopAPI?.minimize|toggleMaximize|close`, et
  `onState` maintient l'état maximisé. Le web (Vite seul) n'a pas de `desktopAPI` : les
  boutons restent neutres.
- Le routeur est un hash (`#dashboard`, `#students`) et `document.title` est piloté par
  `meta.title` — conserver ce comportement pour les fenêtres détachées.
- `main.js`/`preload.js` (skill `electron-packaging`) exigent un redémarrage d'Electron ;
  le renderer, lui, bénéficie du HMR Vite.

## Avant de conclure

```bash
cd app && npm run build          # build de production
```

Puis, si le backend tourne : ouvrir la page et vérifier que les données proviennent bien de
`http://127.0.0.1:8001/api` (skill `diallo-dev-setup`).
