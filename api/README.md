# Kalanso API — Laravel 13 + MySQL

API REST de l'application de gestion scolaire **Kalanso**. Elle expose les
données réelles de l'établissement : élèves, classes, matières, personnel,
emploi du temps, notes, absences, finances, admissions, messagerie, documents
et notifications.

La base démarre **vide** : aucun compte ni aucune donnée de démonstration n'est
injecté par les seeders. Le premier compte Direction et l'établissement sont
créés par le formulaire de première configuration de l'application
(`POST /api/setup`).

## Stack

| Élément | Version / choix |
|---|---|
| Framework | Laravel 13 |
| Langage | PHP 8.5 |
| Base de données | MariaDB 10.11 / MySQL 8 |
| Authentification | Laravel Sanctum (tokens Bearer) |
| Format | JSON, pagination Laravel |
| URL locale | `http://127.0.0.1:8001` |

## Installation

```bash
cd api

# dépendances
composer install

# configuration
cp .env.example .env
php artisan key:generate

# créer la base et l'utilisateur MySQL (exemple)
sudo mysql -e "
CREATE DATABASE IF NOT EXISTS arena CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'arena'@'localhost' IDENTIFIED BY 'mot-de-passe';
GRANT ALL PRIVILEGES ON arena.* TO 'arena'@'localhost';
FLUSH PRIVILEGES;"

# renseigner DB_DATABASE=arena, DB_USERNAME=arena, DB_PASSWORD=... dans .env
# (le nom technique de la base reste `arena` pour ne pas casser les postes existants)
php artisan migrate
php artisan storage:link
php artisan serve --host=127.0.0.1 --port=8001
```

L'API répond alors sur `http://127.0.0.1:8001/api`. Au premier lancement de
l'interface, Kalanso propose de créer l'établissement et le premier compte
Direction : il n'y a plus aucun compte de démonstration.

## Application desktop Ubuntu

Le paquet Electron (`gallery/electron`) embarque cette API et la démarre
automatiquement sur `127.0.0.1:8001` : inutile de lancer `php artisan serve`
manuellement. Au premier démarrage, l'API est copiée dans
`~/.config/kalanso-desktop/backend`, les migrations sont appliquées, puis le
service est arrêté avec l'application. Journaux :
`~/.config/kalanso-desktop/logs/backend.log`.

```bash
cd gallery/electron
npm run dist:linux      # AppImage + .deb dans release/
```

La base MariaDB/MySQL et le fichier `api/.env` doivent être configurés au
préalable. En développement, l'application réutilise une API déjà lancée sur le
port 8001.

## Première configuration

Sur une base vide, l'application affiche l'écran de mise en route. Elle appelle :

```bash
# état de la base (public)
curl http://127.0.0.1:8001/api/setup/status
# → {"needs_setup":true,"google_enabled":false,"app_name":"Kalanso"}

# création atomique de l'établissement, de l'année (3 trimestres) et du compte Direction
curl -X POST http://127.0.0.1:8001/api/setup \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
    "school_name":"Mon établissement",
    "school_full_name":"École internationale",
    "currency":"FCFA",
    "year_label":"2026 — 2027",
    "year_starts_on":"2026-09-01",
    "year_ends_on":"2027-06-30",
    "name":"Prénom Nom",
    "email":"direction@mon-ecole.com",
    "password":"motdepasse123",
    "password_confirmation":"motdepasse123"
  }'
```

La route `POST /api/setup` se ferme automatiquement dès qu'un compte existe
(réponse `403`).

## Connexion Google

La connexion Google est réservée aux **comptes Kalanso existants** : à la
première connexion, le compte est lié automatiquement si l'adresse e-mail
Google est vérifiée et correspond à un utilisateur.

1. Créez un identifiant OAuth dans **Google Cloud Console → API et services →
   Identifiants**. Le type *Application de bureau* est recommandé (la boucle
   locale `http://127.0.0.1:port/oauth/callback` est acceptée sans port fixe).
2. Renseignez les variables dans `api/.env` puis redémarrez l'application :

```dotenv
GOOGLE_CLIENT_ID=votre-identifiant.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=votre-secret
```

Le flux desktop utilise PKCE et une boucle locale dans Electron ; le **secret
reste dans l'API**, qui échange le code contre un token Sanctum après
vérification du compte Google.

## Authentification

```bash
# 1. récupérer un token
curl -X POST http://127.0.0.1:8001/api/login \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{"email":"direction@mon-ecole.com","password":"motdepasse123","device_name":"desktop"}'

# 2. appeler une route protégée
curl http://127.0.0.1:8001/api/me \
  -H 'Accept: application/json' \
  -H "Authorization: Bearer <token>"

# 3. se déconnecter (révoque le token courant)
curl -X POST http://127.0.0.1:8001/api/logout \
  -H 'Accept: application/json' \
  -H "Authorization: Bearer <token>"
```

Toutes les routes métier (élèves, classes, notes, finances, messagerie,
documents, notifications…) exigent un token Sanctum. Seuls `/api/health`,
`/api/setup*`, `/api/auth/google/status`, `/api/auth/google/exchange` et
`/api/login` sont publics.

## Endpoints

### Système et authentification

| Méthode | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | — | État de l'API |
| `GET` | `/api/setup/status` | — | Indique si la première configuration est requise |
| `POST` | `/api/setup` | — | Crée l'établissement, l'année et le compte Direction (une seule fois) |
| `GET` | `/api/auth/google/status` | — | Connexion Google activée + identifiant public |
| `POST` | `/api/auth/google/exchange` | — | Échange le code Google (PKCE) contre un token Sanctum |
| `POST` | `/api/login` | — | Connexion, retourne un token |
| `GET` | `/api/me` | token | Utilisateur courant |
| `POST` | `/api/logout` | token | Révoque le token courant |
| `GET` | `/api/school` | — | Établissement, année et semestre courants |
| `PUT/PATCH` | `/api/school` | token | Met à jour l'établissement |
| `GET` | `/api/meta` | — | Données de démarrage : classes, matières, départements, types de frais, compteurs, énumérations |
| `GET` | `/api/dashboard` | — | KPI, recouvrement mensuel, répartition des classes, cours du jour, élèves récents, notifications |

### Élèves

| Méthode | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/students` | — | Liste paginée (`q`, `class_id`, `level`, `status`, `active`, `per_page`) |
| `POST` | `/api/students` | token | Créer un élève |
| `GET` | `/api/students/{id}` | — | Fiche complète + moyenne, solde, absences |
| `PUT/PATCH` | `/api/students/{id}` | token | Mise à jour partielle ou complète |
| `DELETE` | `/api/students/{id}` | token | Supprimer un élève |
| `GET` | `/api/students/{id}/report-card` | — | Bulletin (`term_id` optionnel) : moyennes par matière, moyenne générale, rang, mention |

### Classes et matières

| Méthode | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/classes` | — | Classes de l'année (`academic_year_id`, `level`) avec effectifs |
| `POST` | `/api/classes` | token | Créer une classe |
| `GET` | `/api/classes/{id}` | — | Classe + élèves, matières, enseignants, emploi du temps |
| `PUT/PATCH` | `/api/classes/{id}` | token | Mise à jour |
| `DELETE` | `/api/classes/{id}` | token | Supprimer |
| `GET` | `/api/subjects` | — | Matières (`department_id`, `active`) |
| `POST` | `/api/subjects` | token | Créer une matière |
| `GET` | `/api/subjects/{id}` | — | Matière + classes + enseignants |
| `PUT/PATCH` | `/api/subjects/{id}` | token | Mise à jour |
| `DELETE` | `/api/subjects/{id}` | token | Supprimer |

### Personnel

| Méthode | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/staff` | — | Personnel (`q`, `department_id`, `role`, `active`) |
| `POST` | `/api/staff` | token | Créer un membre |
| `GET` | `/api/staff/{id}` | — | Fiche + classes, matières, emploi du temps |
| `PUT/PATCH` | `/api/staff/{id}` | token | Mise à jour |
| `DELETE` | `/api/staff/{id}` | token | Supprimer |

### Emploi du temps, notes et absences

| Méthode | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/timetable` | — | Créneaux (`class_id`, `staff_id`, `day`, `term_id`, `live`) + vue groupée par jour |
| `POST` | `/api/timetable` | token | Créer un créneau |
| `GET` | `/api/timetable/{id}` | — | Détail d'un créneau |
| `PUT/PATCH` | `/api/timetable/{id}` | token | Mise à jour |
| `DELETE` | `/api/timetable/{id}` | token | Supprimer |
| `GET` | `/api/grades` | — | Notes paginées (`student_id`, `subject_id`, `class_id`, `term_id`, `evaluation`) |
| `POST` | `/api/grades` | token | Créer ou mettre à jour une note (clé élève/matière/trimestre/évaluation) |
| `GET` | `/api/grades/{id}` | — | Détail |
| `PUT/PATCH` | `/api/grades/{id}` | token | Mise à jour |
| `DELETE` | `/api/grades/{id}` | token | Supprimer |
| `GET` | `/api/absences` | — | Absences (`student_id`, `class_id`, `from`, `to`, `justified`) |
| `POST` | `/api/absences` | token | Enregistrer une absence |
| `GET` | `/api/absences/{id}` | — | Détail |
| `PUT/PATCH` | `/api/absences/{id}` | token | Mise à jour |
| `POST` | `/api/absences/{id}/justify` | token | Justifier une absence |
| `DELETE` | `/api/absences/{id}` | token | Supprimer |

### Finances

| Méthode | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/invoices` | — | Factures (`student_id`, `class_id`, `status`, `term_id`, `overdue`) + montant payé |
| `POST` | `/api/invoices` | token | Créer une facture (référence générée si absente) |
| `GET` | `/api/invoices/{id}` | — | Facture + paiements + solde |
| `PUT/PATCH` | `/api/invoices/{id}` | token | Mise à jour |
| `DELETE` | `/api/invoices/{id}` | token | Supprimer |
| `GET` | `/api/payments` | — | Paiements (`student_id`, `invoice_id`, `method`, `status`, `from`, `to`) |
| `POST` | `/api/payments` | token | Enregistrer un paiement et recalculer le statut de la facture |
| `GET` | `/api/payments/{id}` | — | Détail |
| `PUT/PATCH` | `/api/payments/{id}` | token | Mise à jour |
| `DELETE` | `/api/payments/{id}` | token | Supprimer et recalculer la facture |
| `GET` | `/api/finance/summary` | — | KPI financiers, séries mensuelles, répartition par méthode/type/statut, principaux débiteurs |

### Admissions, messagerie, documents et notifications

| Méthode | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/admissions` | — | Dossiers (`q`, `status`, `class_id`) |
| `GET` | `/api/admissions/stats` | — | Compteurs par colonne du pipeline |
| `POST` | `/api/admissions` | token | Créer un dossier |
| `GET` | `/api/admissions/{id}` | — | Détail |
| `PUT/PATCH` | `/api/admissions/{id}` | token | Mise à jour (date de décision automatique) |
| `POST` | `/api/admissions/{id}/enroll` | token | Convertir le candidat en élève |
| `DELETE` | `/api/admissions/{id}` | token | Supprimer |
| `GET` | `/api/threads` | — | Conversations (`type`, `archived`, `unread`) |
| `POST` | `/api/threads` | token | Créer une conversation + premier message |
| `GET` | `/api/threads/{id}` | — | Conversation + messages |
| `PUT/PATCH` | `/api/threads/{id}` | token | Modifier / archiver |
| `POST` | `/api/threads/{id}/messages` | token | Ajouter un message |
| `POST` | `/api/threads/{id}/read` | token | Marquer les messages comme lus |
| `DELETE` | `/api/threads/{id}` | token | Supprimer |
| `GET` | `/api/documents` | — | Documents (`student_id`, `type`) avec URL publique |
| `POST` | `/api/documents` | token | Téléverser un document (`multipart/form-data`) |
| `GET` | `/api/documents/{id}` | — | Détail + URL |
| `GET` | `/api/documents/{id}/download` | — | Téléchargement |
| `DELETE` | `/api/documents/{id}` | token | Supprimer le fichier et l'enregistrement |
| `POST` | `/api/students/{id}/photo` | token | Remplacer la photo de profil de l'élève |
| `POST` | `/api/students/{id}/photos` | token | Ajouter une ou plusieurs photos (`photos[]`) |
| `POST` | `/api/staff/{id}/photo` | token | Remplacer la photo du personnel |
| `POST` | `/api/staff/{id}/photos` | token | Ajouter des photos au personnel |
| `POST` | `/api/school/photo` | token | Remplacer le logo de l'établissement |
| `POST` | `/api/school/photos` | token | Ajouter des photos à l'établissement |
| `POST` | `/api/me/avatar` | token | Remplacer la photo de profil de l'utilisateur connecté |
| `DELETE` | `/api/photos/{id}` | token | Supprimer une photo et son fichier |
| `GET` | `/api/notifications` | — | Notifications (`unread`, `type`) |
| `POST` | `/api/notifications/read-all` | token | Tout marquer comme lu |
| `POST` | `/api/notifications/{id}/read` | token | Marquer une notification comme lue |
| `DELETE` | `/api/notifications/{id}` | token | Supprimer |

### Référentiels

| Méthode | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/references/departments` | — | Départements |
| `POST` | `/api/references/departments` | token | Créer |
| `PUT/PATCH` | `/api/references/departments/{id}` | token | Mise à jour |
| `DELETE` | `/api/references/departments/{id}` | token | Supprimer |
| `GET` | `/api/references/fee-types` | — | Types de frais |
| `POST` | `/api/references/fee-types` | token | Créer |
| `PUT/PATCH` | `/api/references/fee-types/{id}` | token | Mise à jour |
| `DELETE` | `/api/references/fee-types/{id}` | token | Supprimer |
| `GET` | `/api/references/academic-years` | — | Années scolaires + trimestres |
| `POST` | `/api/references/academic-years` | token | Créer une année |
| `GET` | `/api/references/terms` | — | Trimestres (`academic_year_id`) |
| `POST` | `/api/references/terms` | token | Créer un trimestre |

## Base vide

`php artisan migrate` prépare les tables, **sans aucun compte ni donnée de
démonstration**. `DatabaseSeeder` est volontairement vide : la première
configuration se fait depuis l'application via `POST /api/setup`.

## Structure utile

```
api/
├── app/Http/Controllers/Api/   # contrôleurs REST + Setup + Google
├── app/Models/                 # 22 modèles Eloquent
├── app/Models/Concerns/        # traits partagés (photos)
├── database/migrations/        # 22 migrations métier + tables Laravel
├── database/seeders/           # DatabaseSeeder vide (base neuve)
├── routes/api.php              # routes publiques et protégées
└── config/cors.php             # CORS ouvert pour l'app Electron / Vite local
```

## Notes

- Les montants sont en **FCFA** et stockés en `DECIMAL(12,2)`.
- Les dates sont renvoyées au format ISO 8601 ; les filtres `from`/`to` acceptent `YYYY-MM-DD`.
- Les listes paginées renvoient la structure Laravel standard (`data`, `current_page`, `last_page`, `total`).
- Les erreurs de validation renvoient `422` avec `errors`.
- Sans token sur une écriture, l'API renvoie `401`.
- Les photos sont stockées sur le disque public (`storage/app/public`) et exposées via `photo_url` et l'objet `photos` (`url`). `Photo::getImageUrl()` renvoie l'original : Kalanso n'embarque pas GD/Imagick ni Glide, donc aucun redimensionnement serveur n'est effectué.
