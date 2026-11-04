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
  car l'hébergeur ne lance pas Composer ;
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
git push origin deploy/lws --force
```

Puis dans **LWS Panel → Git → Déployer** à nouveau. Pour appliquer
d'éventuelles nouvelles migrations : réimportez le schéma mis à jour
**uniquement si de nouvelles tables manquent** (sinon, préférez `php artisan
migrate --force` en SSH — les données sont conservées) ou demandez le SQL des
migrations manquantes.

## 9. Brancher l'application Kalanso

L'application desktop saura utiliser cette API via son adresse
`https://kalanso.mandenbaoubab.com` (option « API distante » à activer dans
l'application). Les données de tous les postes seront alors centralisées
dans la base MySQL de l'hébergeur.

**Sécurité** : le `.env` en ligne contient les accès MySQL et le secret
Google — il n'est jamais servi par le serveur web et n'est pas dans Git.
Gardez aussi `APP_DEBUG=false` en production (valeur du modèle).
