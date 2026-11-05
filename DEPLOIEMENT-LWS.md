# Mettre l'API Kalanso en ligne — sous-domaine `kalanso.mandenbaoubab.com`

Ce guide déploie l'API Laravel sur un hébergement mutualisé LWS en utilisant
le déploiement Git du panneau. À la fin, l'API répond sur
`https://kalanso.mandenbaoubab.com/api/health` et l'application Kalanso
pourra s'y connecter depuis n'importe quel poste.

**Ce qui a déjà été préparé dans le dépôt :**

- `api/database/schema/kalanso-mysql-schema.sql` — schéma complet de la base
  (31 tables, **sans aucune donnée**) à importer via phpMyAdmin ;
- `.htaccess` à la racine — si le sous-domaine pointe vers le dossier du dépôt,
  toutes les requêtes sont servies par `api/public` et les fichiers sensibles
  (`.env`, `composer.*`…) ne sont jamais exposés ;
- `api/.env.production.example` — modèle de configuration prêt pour le
  sous-domaine ;
- branche `deploy/lws` — le code + les dépendances (`api/vendor`) incluses,
  car l'hébergeur ne lance pas Composer ; branche **append-only** : ne la
  forcez (push) jamais, l'hébergeur cale sur l'historique ;
- confiance aux proxys activée (HTTPS détecté correctement derrière l'hébergeur).

---

## 1. Créer la base MySQL (LWS Panel)

1. **LWS Panel → Bases de données MySQL → Créer**.
2. Notez les trois valeurs affichées (souvent préfixées, ex. `mandenba_kalanso`) :
   - nom de la base,
   - utilisateur,
   - mot de passe.

## 2. Créer le sous-domaine

1. **LWS Panel → Sous-domaines → Ajouter**.
2. Sous-domaine : `kalanso`, domaine : `mandenbaoubab.com`.
3. Dossier du site : deux variantes possibles :
   - **Variante A (recommandée si le panneau le permet)** : indiquez comme
     dossier `…/api/public` (le chemin exact du sous-dossier du dépôt).
   - **Variante B** : laissez la racine du dépôt ; le `.htaccess` redirige
     alors toutes les requêtes vers `api/public`.
4. **PHP** : choisissez la version **8.3 ou 8.4** (minimum requis : 8.3).
5. **SSL** : activez le certificat gratuit (Let's Encrypt / SSL LWS) pour
   `kalanso.mandenbaoubab.com` et forcez l'HTTPS.

## 3. Déployer le code par Git

1. **LWS Panel → Git** (ou « Versionnage ») → Ajouter un dépôt.
2. Dépôt : `https://github.com/moussantji/Arena.git`
3. Branche : **`deploy/lws`**.
4. Dossier de destination : le dossier choisi à l'étape 2.
5. Lancez le déploiement. Le panneau télécharge le code + `api/vendor`.

## 4. Créer le fichier `.env`

Via **Gestionnaire de fichiers** de LWS :

1. Copiez `api/.env.production.example` vers `api/.env`.
2. Renseignez `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` (étape 1).
3. Connexion Google : recopiez les deux lignes `GOOGLE_CLIENT_ID` et
   `GOOGLE_CLIENT_SECRET` depuis le `.env` de votre PC (`api/.env`).
   Sans le secret, le bouton « Se connecter avec Google » reste masqué.
   Aucun réglage à changer dans Google Cloud Console : l'application
   utilise toujours l'adresse de retour locale (127.0.0.1), seul l'échange
   du code se fait désormais sur le serveur.
4. Enregistrez.

## 5. Créer les tables (une fois)

**Via phpMyAdmin (LWS Panel → Bases de données → phpMyAdmin) :**

1. Sélectionnez la base `…kalanso` à gauche.
2. Onglet **Importer** → choisissez le fichier
   `api/database/schema/kalanso-mysql-schema.sql` (téléchargez-le depuis
   GitHub : branche `deploy/lws`) → **Exécuter**.
3. « L'import s'est terminé avec succès » : les 31 tables sont créées,
   la base reste vide (aucune donnée de démonstration).

**Ou, si vous avez un accès SSH/Terminal :**

```bash
cd api && php artisan migrate --force
```

## 6. Clé d'application

Le `.env` doit contenir une `APP_KEY`. Deux options :

- **SSH** : `cd api && php artisan key:generate --force` ;
- **Sans SSH** : générez-en une (par exemple avec
  [Laravel Key Generator](https://laravel-key-generator.com) ou toute autre
  source fiable — 32 octets en base64, préfixe `base64:`) et collez-la dans
  `APP_KEY=` du `.env`.

## 7. Vérifier

<https://kalanso.mandenbaoubab.com/api/health> doit répondre
`{"status":"ok",…}`.

## 8. Mises à jour de l'API

Sur votre PC :

```bash
# une fois les changements commités sur votre branche
bash scripts/api-deploy-branch.sh
git push origin deploy/lws
```

> `deploy/lws` n'est **jamais forcée** : la branche ne fait qu'avancer
> (append-only). Un `git push --force` cassait la mise à jour côté
> hébergeur (il cale sur l'historique). L'historique a été réconcilié le
> 5 novembre 2026 pour aligner l'état ; tout est un fast-forward depuis.

Puis dans **LWS Panel → Git → Déployer** à nouveau. Pour appliquer
d'éventuelles nouvelles migrations : réimportez le schéma mis à jour
**uniquement si de nouvelles tables manquent** (sinon, préférez `php artisan
migrate --force` en SSH — les données sont conservées) ou demandez le SQL des
migrations manquantes.

**Mise à jour du 5 novembre 2026 (journal d'audit + verrouillage des périodes)** :
déployez d'abord la branche `deploy/lws`, puis dans phpMyAdmin
(onglet SQL) exécutez le contenu de
`api/database/schema/kalanso-migrations-2026-11-05.sql`. Ce script est sans
danger pour les données : il crée la table `audit_logs` et ajoute la colonne
`terms.locked_at`.

**Comptes parents (application mobile)** :
redéployez `deploy/lws`, puis exécutez dans phpMyAdmin (onglet SQL) le
contenu de `api/database/schema/kalanso-migrations-2026-11-05-parent-student.sql`
(crée la table `parent_student`). Sans lui, la création de comptes parents
échoue. Rappel : exécutez aussi `kalanso-migrations-2026-11-05-is-creator.sql`
si ce n'est pas déjà fait.

**Déploiement du 5 novembre 2026 (application mobile)** :
le dernier `deploy/lws` embarque aussi une page publique
`https://kalanso.mandenbaoubab.com/confidentialite` (politique de
confidentialité exigée par le Play Store). Rien à configurer : elle est en
ligne dès le clic sur Déployer. Aucune donnée n'y est collectée.

**Mise à jour du 5 novembre 2026 (restriction PC + créateur)** :
redéployez `deploy/lws` — la restriction PC est alors appliquée (connexions
des comptes enseignants refusées sur le poste, code PHP). Puis, dans
phpMyAdmin (onglet SQL), exécutez le contenu de
`api/database/schema/kalanso-migrations-2026-11-05-is-creator.sql` : il ajoute
la colonne `users.is_creator` et désigne le tout premier compte comme créateur
de l'établissement (le seul à voir et modifier l'adresse du serveur de données
dans les Paramètres). Sans ce script, tout fonctionne mais le réglage serveur
reste visible par toute la Direction.

## 8 bis. Sauvegardes et restauration

Trois choses sont à sauvegarder régulièrement (avant chaque mise à jour du
serveur, idéalement chaque semaine) :

1. **La base MySQL** — phpMyAdmin (LWS Panel → Bases de données →
   phpMyAdmin) → sélectionnez la base → onglet **Exporter** → format SQL,
   méthode rapide → **Exécuter**. Le fichier `kalanso-aaaa-mm-jj.sql` contient
   toutes les données (élèves, notes, finances, comptes…). Stockez-le hors
   du serveur (PC, clé USB, disque externe) et **vérifiez de temps en temps
   que le fichier s'ouvre** (`head -20` ou un éditeur).
2. **Les fichiers envoyés** — via le Gestionnaire de fichiers de LWS,
   compressez puis téléchargez le dossier `api/storage/app/public`
   (photos d'élèves et de personnel, documents). Ce dossier n'est pas dans
   Git : sans cette sauvegarde, les photos sont perdues en cas de
   restauration du serveur.
3. **Le fichier `api/.env`** — il contient les accès MySQL, la clé Google et
   la clé applicative. Conservez-en une copie privée hors du serveur (gestionnaire
   de mots de passe). Sans lui, il faut tout reconfigurer à la main.

**Restauration complète** (serveur vierge ou sinistre) :

1. Déployez `deploy/lws` via Git (étape 3) puis recréez `api/.env` (étape 4).
2. phpMyAdmin → onglet **SQL** → collez le contenu de
   `kalanso-mysql-schema.sql` (structure) **ou** directement l'export du
   point 1 ci-dessus (structure + données — inutile de rejouer le schéma).
3. Ré-importez `api/storage/app/public` depuis la sauvegarde (étape 2).
4. Recréez le lien `api/public/storage` → `../storage/app/public` si vous
   utilisez le mode local (`php artisan storage:link` en SSH).
5. Vérifiez `https://kalanso.mandenbaoubab.com/api/health`, puis connectez
   un poste — les données doivent être là.

**Test de restauration** : une sauvegarde non testée n'est pas une
sauvegarde. Une fois par trimestre, restaurez l'export sur une base
jetable locale (phpMyAdmin local) et vérifiez que l'application s'ouvre
sur ces données.

**En-têtes de sécurité** : depuis la mise à jour du 5 novembre 2026, les
`.htaccess` (racine et `api/public`) ajoutent des en-têtes de protection
(HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
`Permissions-Policy`) — sans aucun risque si `mod_headers` est absent
(les directives sont ignorées proprement).

**Journal d'audit** : les connexions (réussies et échouées), les connexions
Google et les modifications de comptes sont désormais journalisées dans
`audit_logs` (visible par la Direction dans **Menu Système → Journal**).
Un changement de mot de passe révoque immédiatement toutes les sessions du
compte concerné.

## 8 ter. Comptes parents (application mobile)

L'application mobile Kalanso permet aux parents et aux enseignants d'accéder
à l'école depuis leur téléphone. Les comptes se créent **sur le PC** :

1. Connectez-vous avec un compte **Direction** → **Paramètres → Utilisateurs**.
2. Section **Comptes parents** → **Nouveau compte parent**.
3. Renseignez le nom, l'e-mail, un mot de passe initial
   (**10 caractères minimum**) et **cochez les enfants liés** (recherche
   par nom). Un parent ne voit que ses propres enfants — notes, absences,
   finances.
4. Communiquez le mot de passe initial au parent (en main propre ou par
   messagerie sécurisée) ; il pourra le changer depuis l'application
   (**Compte → Changer le mot de passe**).

Côté serveur, la création est refusée tant que la table `parent_student`
n'existe pas : après le déploiement de `deploy/lws`, exécutez le SQL
`api/database/schema/kalanso-migrations-2026-11-05-parent-student.sql`
(et `…-is-creator.sql` si pas déjà fait). Les comptes **enseignants** sont
quant à eux refusés sur le PC (message « réservé à l'application mobile ») ;
ils utiliseront l'application mobile.

L'application mobile (Android, Play Store) est en préparation — le fichier
d'installation et la procédure vous seront remis avec la version finale.

## 9. Brancher l'application Kalanso (multi-postes)

Sur chaque poste, connectez-vous avec le compte **créateur** de
l'établissement (le premier compte créé), puis ouvrez
**Paramètres → Préférences → Serveur de données → Modifier**, renseignez :

```text
https://kalanso.mandenbaoubab.com
```

puis **« Enregistrer et redémarrer »**. À l'écran de connexion suivant,
connectez-vous avec le compte de l'établissement : les données de tous les
postes sont centralisées dans la base MySQL de l'hébergeur.

L'écran de connexion n'affiche jamais l'adresse du serveur — et le réglage
est réservé au **créateur** de l'établissement (le premier compte créé,
marqué `is_creator` en base), pas même aux autres comptes de direction.
Sur un poste tout neuf
(base locale vide), la première installation crée un compte local qui sert
uniquement à atteindre les Paramètres ; il devient inutile après le
basculement vers le serveur.

Pour revenir au mode local (données stockées uniquement sur le poste), videz
l'adresse dans le même écran. Cette fonctionnalité est incluse à partir de la
version **1.3.2** de l'application.

**Sécurité** : le `.env` en ligne contient les accès MySQL et le secret
Google — il n'est jamais servi par le serveur web et n'est pas dans Git.
Gardez aussi `APP_DEBUG=false` en production (valeur du modèle).

**Restriction PC** : depuis la mise à jour du 5 novembre 2026, l'application
de bureau refuse la connexion des comptes **enseignants** (et, plus tard,
**parents**) — sur le poste de l'établissement, seuls la direction, le
secrétariat et la comptabilité se connectent. Les enseignants verront le
message « Ce compte est réservé à l'application mobile Kalanso ». Le
changement s'applique dès le déploiement de `deploy/lws` ; l'application
mobile (enseignants + parents) suivra dans une prochaine étape.
