---
name: laravel-api
description: Conventions de l'API Laravel de DIALLO dans api/ — routes REST, contrôleurs Api\, filtres de liste, pagination, accès Sanctum, validation, append() d'attributs calculés, tests. À utiliser pour ajouter/modifier un endpoint, un contrôleur, un modèle, un migrate ou un test.
---

# DIALLO — API Laravel (`api/`)

Laravel 13, API JSON consommée par React/Electron sous `http://127.0.0.1:8001/api`.
Namespace des contrôleurs : `App\Http\Controllers\Api`.

## Layout

```
api/routes/api.php          ~105 routes, un fichier
api/app/Http/Controllers/Api/*.php   20 contrôleurs
api/app/Models/*.php        Student, SchoolClass, Subject, Grade, Invoice, Payment, Absence, Admission, Staff, Message(Thread), TimetableSlot, Photo, School, User…
api/tests/Feature, api/tests/Unit
```

## Règles de routes

- **Lecture publique** hors groupe d'auth ; **écritures** dans
  `Route::middleware('auth:sanctum')->group(...)`.
- CRUD standard : `POST /students`, `Route::match(['put','patch'], '/students/{student}')`,
  `DELETE` → `204` (`response()->json(status: 204)`).
- Création/`update` → `201` / `200` avec l'objet chargé : `['subject' => $subject->load(...)]`.
- Routes d'agrégat en `/finance/summary`, `/admissions/stats`, dashboard via `__invoke`.
- Ajout d'une ressource : déclarer les lectures **avant** le groupe sanctum, puis les écritures dedans.

## Conventions de contrôleur

- Retourne toujours `JsonResponse`, signature `: JsonResponse`.
- Eager load **avec colonnes explicites** : `->with(['photos:id,student_id,filename', 'schoolClass:id,name,level,room'])`.
- Filtres de liste via `->when($request->filled('x'), fn ($q) => $q->where(...))` — jamais de `if` imbriqués.
  Recherche `q` : `like` sur `first_name`, `last_name`, `matricule`, `guardian_name` (regroupés dans un closure pour éviter un `orWhere` global).
- Pagination : `->paginate()->withQueryString()`.
- Attributs calculés exposés via `append(['average', 'balance'])` plutôt que dans le JSON du contrôleur.
- Validation inline : `$request->validate($this->rules())` avec un `rules()` privé, variante `rules($subject)` pour l'unicité hors de la ligne éditée (`Rule::unique')->ignore($subject->id)`).
- Agrégats : `selectRaw("DATE_FORMAT(paid_on, '%Y-%m') as month, SUM(amount) as total")` + `groupBy`, et `Carbon::translatedFormat('M')` pour les libellés français.
- Dates relatives : `AcademicYear::current()`, `now()->startOfMonth()`/`endOfMonth()`.

## Tests

```bash
cd api && composer test      # config:clear puis artisan test
php artisan test --filter=StudentTest
```

Un endpoint nouveau = une feature test (liste filtrée, création validée, 422, 204, 401 sans token).

## Ce qui n'est pas acceptable

- Aucune donnée métier en dur côté front : le front ne doit jamais inventer un montant, un effectif ou un statut — l'API les fournit (skill `react-ui`).
- Ne pas exposer des colonnes non nécessaires : garder les `with()` en projection `:id,...`.
- Ne pas changer les clés de réponse sans adapter `app/src/data.jsx` et les pages qui les lisent.
- Le schéma de démo est généré par les seeders : ne pas modifier les seeders pour « arranger » un écran.

Voir `references/conventions.md` pour un contrôleur type complet et la liste des routes.
