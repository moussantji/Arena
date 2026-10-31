# Checklist — paquet Linux DIALLO

## Avant de builder

- [ ] `cd app && npm run build` passe (le paquet lit `app/dist`, il n'est jamais copié à la main).
- [ ] `api/vendor/` est présent (`composer install`), sinon le paquet sera inutilisable.
- [ ] `api/.env` existe (sinon « Configuration .env absente du paquet API. » au premier lancement).
- [ ] Aucune donnée de test dans `api/storage/app` : elle voyagerait dans le paquet.
- [ ] Rien que PHP doit lire n'est placé dans `files` : l'asar n'est pas un système de
  fichiers pour PHP, ces fichiers passent par `extraResources`.

## Build

```bash
cd gallery/electron
npm run dist:dir     # vérification rapide du contenu
npm run dist:linux   # AppImage + deb x64 dans release/
```

## Vérifier le contenu produit

```bash
ls release/linux-unpacked/resources/          # app/ et api/ doivent être là
ls release/linux-unpacked/resources/api/vendor/autoload.php
ls release/linux-unpacked/resources/api/.env
ls release/linux-unpacked/resources/app/index.html
# absence attendue :
ls release/linux-unpacked/resources/api/tests 2>/dev/null || echo "tests exclus ✓"
ls release/linux-unpacked/resources/api/phpunit.xml 2>/dev/null || echo "phpunit.xml exclu ✓"
ls release/linux-unpacked/resources/api/storage/logs 2>/dev/null || echo "logs exclus ✓"
```

## Premier lancement du paquet

```bash
./release/linux-unpacked/diallo
tail -n 40 ~/.config/diallo-desktop/logs/backend.log
tail -n 40 ~/.config/diallo-desktop/logs/main.log
ls ~/.config/diallo-desktop/backend/.bundle-version
```

Attendus :
- `.bundle-version` écrit (`version-mtime`) ;
- `~/.config/diallo-desktop/backend/public/storage` est un symlink relatif vers `../storage/app/public` ;
- `backend.log` contient la sortie de `php artisan migrate --force` (première installation seulement) ;
- `probeApi` reçoit `"status":"ok"` sur `/api/health` ;
- la fenêtre affiche le dashboard avec les données réelles de la DB locale.

## Upgrade (nouvelle version du paquet)

- La copie du backend est refaite quand `.bundle-version` change.
- Les données de `storage/app` sont sauvegardées puis fusionnées : un utilisateur qui avait
  des photos/fichiers ne les perd pas.
- Test : lancer l'ancienne version, créer une photo d'élève, builder la nouvelle version,
  relancer, vérifier que la photo est toujours servie.

## Dév et installée coexistent

`DIALLO_DEV_PROFILE` isole le profil dev (`~/.config/diallo-desktop-dev`) : dev et AppImage
installée peuvent tourner en parallèle sans se voler la base ni les logs. Ne pas supprimer ce
comportement pour « simplifier ».

## Prérequis cible (Linux)

PHP 8.2+ CLI (`php-cli`) et MariaDB/MySQL serveur. Le dialog d'erreur propose
`sudo apt install php-cli mariadb-server` puis `sudo systemctl start mariadb` — ces deux
chaînes doivent rester exactes.
