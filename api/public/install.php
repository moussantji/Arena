<?php

/**
 * Installation web unique de l'API Kalanso (hébergement mutualisé).
 *
 * Après le déploiement Git, ouvrez :
 *   https://kalanso.mandenbaoubab.com/install.php?token=VOTRE_SECRET
 *
 * Le secret doit correspondre à KALANSO_SETUP_TOKEN du fichier .env
 * (créez d'abord le .env à partir de .env.production.example via le
 * gestionnaire de fichiers de votre hébergeur).
 *
 * Le script : génère la clé d'application si absente, applique les
 * migrations, crée le lien de stockage puis vide le cache de config.
 * Pour le désactiver durablement : videz KALANSO_SETUP_TOKEN dans .env.
 */

declare(strict_types=1);
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;

error_reporting(E_ALL);
ini_set('display_errors', '0');
header('Content-Type: text/html; charset=utf-8');

$base = dirname(__DIR__);
$ok = static fn (string $t): string => "<li><span class=\"ok\">✔</span> {$t}</li>";
$ko = static fn (string $t): string => "<li><span class=\"ko\">✘</span> {$t}</li>";
$info = static fn (string $t): string => "<li><span class=\"info\">•</span> {$t}</li>";

$lines = [];
$failed = false;

$finish = static function () use (&$lines, &$failed): void {
    $state = $failed ? 'ÉCHEC' : 'TERMINÉ';
    $class = $failed ? 'ko' : 'ok';
    echo '<!doctype html><html lang="fr"><head><meta charset="utf-8">'
        .'<meta name="viewport" content="width=device-width, initial-scale=1">'
        .'<title>Installation Kalanso — '.$state.'</title><style>'
        .'body{margin:0;min-height:100vh;display:grid;place-items:center;background:#070B1F;color:#e8ecff;'
        .'font-family:system-ui,Segoe UI,sans-serif}'
        .'main{max-width:560px;padding:36px}h1{font-size:20px;color:#7e9bff;margin:0 0 6px}'
        .'p.sub{color:#9aa6d8;font-size:13px;margin:0 0 18px}'
        .'ul{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:9px;font-size:13px;line-height:1.5}'
        .'li span{margin-right:8px}.ok{color:#6fd3a8}.ko{color:#ff9d9d}.info{color:#9aa6d8}'
        .'code{background:rgba(167,182,255,.12);padding:1px 6px;border-radius:5px;font-size:12px}'
        .'p.note{margin-top:18px;font-size:12px;color:#9aa6d8;line-height:1.6}</style></head><body><main>'
        ."<h1>Installation de l'API Kalanso</h1><p class='sub'>Résultat : <b class='{$class}'>{$state}</b></p>"
        .'<ul>'.implode('', $lines).'</ul>'
        .'<p class="note">Sécurité : cette page reste protégée par <code>KALANSO_SETUP_TOKEN</code>. '
        .'Une fois l\'installation terminée, videz cette valeur dans le fichier <code>.env</code> '
        .'pour désactiver définitivement l\'installateur.</p>'
        .'</main></body></html>';
    exit;
};

/* 1. Version de PHP. */
if (PHP_VERSION_ID < 80300) {
    $lines[] = $ko('PHP '.PHP_VERSION.' détecté : l\'API exige PHP 8.3 ou plus récent (à changer dans le panneau de l\'hébergeur).');
    $failed = true;
    $finish();
}
$lines[] = $ok('PHP '.PHP_VERSION);

/* 2. Fichier .env présent. */
$envPath = $base.'/.env';
if (! is_file($envPath)) {
    $lines[] = $ko('Fichier <code>.env</code> introuvable. Dans le gestionnaire de fichiers, copiez '
        .'<code>api/.env.production.example</code> vers <code>api/.env</code> puis renseignez la base MySQL.');
    $failed = true;
    $finish();
}
$lines[] = $ok('Fichier .env présent');

/* 3. Token d'installation. */
$env = file_get_contents($envPath);
preg_match('/^KALANSO_SETUP_TOKEN=(.*)$/m', $env, $m);
$expected = trim($m[1] ?? '', " \t\n\r\"'");
$given = (string) ($_GET['token'] ?? '');
if ($expected === '') {
    $lines[] = $ko('Désactivé : <code>KALANSO_SETUP_TOKEN</code> est vide dans le <code>.env</code>.');
    $failed = true;
    $finish();
}
if ($given === '' || ! hash_equals($expected, $given)) {
    $lines[] = $ko('Token absent ou incorrect. Utilisez <code>install.php?token=VOTRE_SECRET</code>.');
    $failed = true;
    $finish();
}
$lines[] = $ok('Token d\'installation validé');

/* 4. Démarrage de Laravel en mode console. */
try {
    require $base.'/vendor/autoload.php';
    $app = require $base.'/bootstrap/app.php';
    $app->make(Kernel::class)->bootstrap();
    $lines[] = $ok('Application chargée');
} catch (Throwable $e) {
    $lines[] = $ko('Impossible de démarrer l\'application : '.htmlspecialchars($e->getMessage()));
    $failed = true;
    $finish();
}

/* 5. Clé d'application. */
if (config('app.key') === null || config('app.key') === '') {
    try {
        Artisan::call('key:generate', ['--force' => true]);
        $lines[] = $ok('Clé d\'application (APP_KEY) générée');
    } catch (Throwable $e) {
        $lines[] = $ko('Génération de la clé impossible : '.htmlspecialchars($e->getMessage())
            .' — vérifiez que le fichier .env est accessible en écriture.');
        $failed = true;
        $finish();
    }
} else {
    $lines[] = $info('Clé d\'application déjà présente');
}

/* 6. Base de données + migrations. */
try {
    DB::select('select 1');
    $lines[] = $ok('Connexion MySQL établie');
} catch (Throwable $e) {
    $lines[] = $ko('Connexion MySQL impossible : '.htmlspecialchars($e->getMessage())
        .' — vérifiez DB_DATABASE / DB_USERNAME / DB_PASSWORD dans le .env.');
    $failed = true;
    $finish();
}

try {
    Artisan::call('migrate', ['--force' => true]);
    $lines[] = $ok('Migrations appliquées (tables créées ou à jour)');
} catch (Throwable $e) {
    $lines[] = $ko('Migrations impossible : '.htmlspecialchars($e->getMessage()));
    $failed = true;
    $finish();
}

/* 7. Lien de stockage. */
try {
    if (! file_exists($base.'/public/storage')) {
        Artisan::call('storage:link');
        $lines[] = $ok('Lien de stockage créé');
    } else {
        $lines[] = $info('Lien de stockage déjà présent');
    }
} catch (Throwable $e) {
    $lines[] = $info('Lien de stockage non créé ('.htmlspecialchars($e->getMessage()).') — facultatif pour l\'API.');
}

/* 8. Cache de configuration. */
try {
    Artisan::call('config:cache');
    $lines[] = $ok('Configuration mise en cache');
} catch (Throwable $e) {
    $lines[] = $info('Cache de configuration ignoré : '.htmlspecialchars($e->getMessage()));
}

$finish();
