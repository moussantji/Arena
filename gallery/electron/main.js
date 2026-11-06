// Kalanso — Electron main process
// Fenêtre sans cadre, contexte isolé et service Laravel local démarré
// automatiquement pour que l'application fonctionne comme une vraie app PC.
const {
  app, BrowserWindow, Menu, dialog, ipcMain, shell,
} = require('electron');
const { autoUpdater } = require('electron-updater');
const { execFileSync, spawn } = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const http = require('node:http');
const https = require('node:https');
const path = require('node:path');

const isDev = process.argv.includes('--dev');

// Le mode développement utilise son propre profil : il peut ainsi tourner en
// même temps que l'application installée sans se heurter au verrou d'instance
// unique d'Electron. Les deux fenêtres partagent en revanche la même API.
if (isDev) {
  const devProfile = process.env.KALANSO_DEV_PROFILE
    || path.join(app.getPath('appData'), 'kalanso-desktop-dev');
  app.setPath('userData', devProfile);
}

const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5179';
const API_PORT = Number(process.env.KALANSO_API_PORT || 8001);
const LOCAL_API_ORIGIN = `http://127.0.0.1:${API_PORT}`;

/**
 * API distante : KALANSO_REMOTE_API_URL, définie en variable d'environnement
 * ou dans le .env du backend. Quand elle est renseignée — par exemple
 * https://kalanso.mandenbaoubab.com — l'application ne démarre aucun serveur
 * local et dialogue directement avec le serveur de l'établissement
 * (données centralisées, multi-postes).
 */
function normalizeRemoteUrl(value) {
  return String(value || '').trim().replace(/\/+$/, '').replace(/\/api$/i, '');
}

function remoteApiUrl() {
  const fromEnv = normalizeRemoteUrl(process.env.KALANSO_REMOTE_API_URL);
  if (fromEnv) return fromEnv;

  try {
    const envPath = path.join(app.isPackaged ? apiCacheDir() : apiSourceDir(), '.env');
    const content = fs.readFileSync(envPath, 'utf8');
    const match = content.match(/^\s*KALANSO_REMOTE_API_URL\s*=\s*"?([^"\n\r]+?)"?\s*$/m);
    if (match && match[1].trim()) return normalizeRemoteUrl(match[1]);
  } catch {
    /* fichier .env absent */
  }

  return null;
}

const REMOTE_API_URL = remoteApiUrl();
const API_ORIGIN = REMOTE_API_URL || LOCAL_API_ORIGIN;
const REMOTE_MODE = Boolean(REMOTE_API_URL);
const SOURCE_APP_INDEX = path.join(__dirname, '..', '..', 'app', 'dist', 'index.html');
const PACKAGED_APP_INDEX = path.join(process.resourcesPath, 'app', 'index.html');
const GALLERY_INDEX = path.join(__dirname, '..', 'index.html');
const SPLASH_PAGE = path.join(__dirname, 'splash.html');
const ICON = path.join(__dirname, 'build', 'icon.png');
const LOG_DIR = path.join(app.getPath('userData'), 'logs');

let win = null;
let backend = null;
let backendLog = null;
let quitting = false;

/* ------------------------------------------------------------------ */
/*  Journal de démarrage                                              */
/* ------------------------------------------------------------------ */

function logMain(message) {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    fs.appendFileSync(
      path.join(LOG_DIR, 'main.log'),
      `[${new Date().toISOString()}] ${message}\n`,
    );
  } catch {
    /* le journal ne doit jamais empêcher l'application de démarrer */
  }
}

// Sur certaines cartes graphiques Linux, la composition GPU laisse la
// fenêtre noire. Le rendu logiciel est plus lent mais fiable pour une
// application de bureau. KALANSO_GPU=1 permet de réactiver le GPU.
if (process.platform === 'linux' && process.env.KALANSO_GPU !== '1') {
  app.disableHardwareAcceleration();
}

logMain(
  `--- démarrage ${app.getVersion()} · packaged=${app.isPackaged} · `
  + `display=${process.env.DISPLAY || '?'} · session=${process.env.XDG_SESSION_TYPE || '?'}`
  + `${isDev ? ` · mode=dev · profil=${app.getPath('userData')}` : ''} ---`,
);
if (REMOTE_MODE) logMain(`API distante : ${REMOTE_API_URL}`);

process.on('uncaughtException', (error) => {
  logMain(`uncaughtException: ${error.stack || error.message}`);
  if (app.isReady()) {
    dialog.showErrorBox('Kalanso', `Erreur inattendue au démarrage.\n\n${error.message}`);
  }
});

process.on('unhandledRejection', (reason) => {
  logMain(`unhandledRejection: ${reason?.stack || reason}`);
});

// Arrêt demandé par le système ou par le lanceur de développement : passer
// par app.quit() pour que before-quit arrête aussi l'API Laravel.
function requestQuit(signal) {
  logMain(`signal ${signal} reçu — arrêt.`);
  if (app.isReady()) app.quit();
  else app.exit(0);
}
process.on('SIGTERM', () => requestQuit('SIGTERM'));
process.on('SIGINT', () => requestQuit('SIGINT'));


/* ------------------------------------------------------------------ */
/*  Service Laravel local                                             */
/* ------------------------------------------------------------------ */

const delay = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

function apiSourceDir() {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'api')
    : path.join(__dirname, '..', '..', 'api');
}

function apiCacheDir() {
  return path.join(app.getPath('userData'), 'backend');
}

function logDir() {
  return LOG_DIR;
}

function openBackendLog() {
  if (backendLog && !backendLog.writableEnded) return path.join(LOG_DIR, 'backend.log');
  fs.mkdirSync(LOG_DIR, { recursive: true });
  const logPath = path.join(LOG_DIR, 'backend.log');
  backendLog = fs.createWriteStream(logPath, { flags: 'a' });
  backendLog.write(`\n[${new Date().toISOString()}] --- lancement Kalanso ---\n`);
  return logPath;
}

function probeApi(timeout = 1200) {
  return new Promise((resolve) => {
    const client = API_ORIGIN.startsWith('https:') ? https : http;
    const request = client.get(`${API_ORIGIN}/api/health`, { timeout }, (response) => {
      let body = '';
      response.on('data', (chunk) => { body += chunk; });
      response.on('end', () => {
        resolve(response.statusCode === 200 && body.includes('"status":"ok"'));
      });
    });
    request.on('timeout', () => { request.destroy(); resolve(false); });
    request.on('error', () => resolve(false));
  });
}

function findPhp() {
  const exe = process.platform === 'win32' ? 'php.exe' : 'php';
  const candidates = [
    process.env.KALANSO_PHP_BIN,
    '/usr/bin/php',
    '/usr/local/bin/php',
    ...String(process.env.PATH || '')
      .split(process.platform === 'win32' ? ';' : ':')
      .filter(Boolean)
      .map((dir) => path.join(dir, exe)),
    'C:\\php\\php.exe',
    'C:\\xampp\\php\\php.exe',
  ].filter(Boolean);
  for (const candidate of candidates) {
    try {
      if (!fs.existsSync(candidate)) continue;
      execFileSync(candidate, ['-r', 'echo PHP_VERSION;'], { stdio: 'ignore', timeout: 4000 });
      return candidate;
    } catch {
      /* candidat suivant */
    }
  }
  return null;
}

function ensureWritableBackend(target) {
  const folders = [
    'storage/app/public',
    'storage/framework/cache/data',
    'storage/framework/sessions',
    'storage/framework/views',
    'storage/logs',
    'bootstrap/cache',
  ];
  folders.forEach((folder) => fs.mkdirSync(path.join(target, folder), { recursive: true }));

  // Le lien storage:link généré par Laravel est absolu. On le recrée en
  // relatif pour que le dossier copié fonctionne hors du dépôt.
  // Sous Windows, une jonction (junction) ne requiert pas de droits admin
  // ni le mode développeur ; en échec, l'application continue sans le lien.
  const link = path.join(target, 'public', 'storage');
  try {
    const stat = fs.lstatSync(link);
    if (stat.isDirectory() && !stat.isSymbolicLink()) fs.rmSync(link, { recursive: true, force: true });
    else fs.unlinkSync(link);
  } catch {
    /* lien absent */
  }

  const relativeTarget = path.join('..', 'storage', 'app', 'public');
  const linkTarget = process.platform === 'win32'
    ? path.resolve(path.dirname(link), relativeTarget)
    : relativeTarget;
  try {
    fs.symlinkSync(linkTarget, link, process.platform === 'win32' ? 'junction' : 'dir');
  } catch (error) {
    logMain(`lien storage non recréé (${error.message}) — démarrage poursuivi sans.`);
  }

  ensureEnvFile(target);
}

/**
 * Crée le .env du backend installé s'il est absent (les paquets ne
 * contiennent volontairement aucun identifiant). Une clé d'application
 * est générée automatiquement ; les accès à la base restent à compléter.
 */
function ensureEnvFile(target) {
  const envPath = path.join(target, '.env');
  if (fs.existsSync(envPath)) return;

  const examplePath = path.join(target, '.env.example');
  if (fs.existsSync(examplePath)) {
    fs.copyFileSync(examplePath, envPath);
  } else {
    fs.writeFileSync(envPath, [
      'APP_NAME="Kalanso"',
      'APP_ENV=local',
      'APP_KEY=',
      'APP_DEBUG=false',
      'APP_URL=http://127.0.0.1:8001',
      'DB_CONNECTION=mysql',
      'DB_HOST=127.0.0.1',
      'DB_PORT=3306',
      'DB_DATABASE=arena',
      'DB_USERNAME=arena',
      'DB_PASSWORD=',
      '',
      '# Canal de mise à jour (laisser vide pour GitHub Releases)',
      'KALANSO_UPDATE_URL=',
      '',
      "# API de l'établissement (défaut en production ; laisser vide pour l'API locale)",
      'KALANSO_REMOTE_API_URL=https://kalanso.mandenbaoubab.com',
      '',
    ].join('\n'));
  }

  let content = fs.readFileSync(envPath, 'utf8');
  if (/^APP_KEY=\s*$/m.test(content)) {
    const key = `base64:${crypto.randomBytes(32).toString('base64')}`;
    content = content.replace(/^APP_KEY=.*$/m, `APP_KEY=${key}`);
  }
  if (!/^KALANSO_UPDATE_URL=/m.test(content)) {
    content = `${content.replace(/\s*$/, '')}\n\n# Canal de mise à jour (laisser vide pour GitHub Releases)\nKALANSO_UPDATE_URL=\n`;
  }
  if (/^KALANSO_REMOTE_API_URL=\s*$/m.test(content)) {
    // Installation neuve : défaut = serveur de l'établissement (comme l'app mobile).
    // Ce bloc ne s'exécute pas pour un .env existant (mode local conservé).
    content = content.replace(/^KALANSO_REMOTE_API_URL=\s*$/m, 'KALANSO_REMOTE_API_URL=https://kalanso.mandenbaoubab.com');
  } else if (!/^KALANSO_REMOTE_API_URL=/m.test(content)) {
    content = `${content.replace(/\s*$/, '')}\n\n# API de l'établissement (défaut ; laisser vide pour l'API locale)\nKALANSO_REMOTE_API_URL=https://kalanso.mandenbaoubab.com\n`;
  }
  fs.writeFileSync(envPath, content);
  logMain(`fichier .env créé pour le backend installé : ${envPath}`);
}

function copyBackendTree(source, target) {
  if (process.platform === 'win32') {
    return fs.promises.cp(source, target, { recursive: true, force: true, dereference: false });
  }
  return new Promise((resolve, reject) => {
    const child = spawn('/bin/cp', ['-a', `${source}/.`, `${target}/`], {
      stdio: ['ignore', 'ignore', 'pipe'],
    });
    let stderr = '';
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Copie du service local impossible (code ${code}). ${stderr.slice(0, 400)}`));
    });
  });
}

async function prepareBackend() {
  if (!app.isPackaged) {
    ensureWritableBackend(apiSourceDir());
    return { dir: apiSourceDir(), refreshed: false };
  }

  const source = apiSourceDir();
  const target = apiCacheDir();
  const version = `${app.getVersion()}-${Math.round(fs.statSync(source).mtimeMs)}`;
  const marker = path.join(target, '.bundle-version');
  let refreshed = true;

  try {
    refreshed = fs.readFileSync(marker, 'utf8').trim() !== version;
  } catch {
    /* première installation */
  }

  if (refreshed) {
    // Les photos et documents envoyés par les utilisateurs vivent dans
    // storage/app du backend installé. Une mise à jour du paquet ne doit pas
    // les effacer : on les met de côté puis on les fusionne avec le nouveau
    // bundle (les fichiers du bundle restent prioritaires).
    const targetStorage = path.join(target, 'storage', 'app');
    const backupStorage = path.join(app.getPath('userData'), 'backend-storage-backup');
    let hasBackup = false;

    try {
      await fs.promises.rename(targetStorage, backupStorage);
      hasBackup = true;
    } catch {
      /* première installation ou storage absent */
    }

    // La configuration installée (.env : base de données, identifiants
    // Google…) est propre au poste : une mise à jour du paquet ne doit pas
    // la remplacer par celle, vierge, embarquée dans le bundle.
    const targetEnv = path.join(target, '.env');
    const backupEnv = path.join(app.getPath('userData'), 'backend-env-backup');
    let hasEnvBackup = false;

    try {
      await fs.promises.copyFile(targetEnv, backupEnv);
      hasEnvBackup = true;
    } catch {
      /* première installation : le .env du bundle sera utilisé */
    }

    await fs.promises.rm(target, { recursive: true, force: true });
    await fs.promises.mkdir(target, { recursive: true });
    await copyBackendTree(source, target);

    if (hasBackup) {
      await fs.promises.mkdir(path.dirname(targetStorage), { recursive: true });
      await fs.promises.cp(backupStorage, targetStorage, {
        recursive: true,
        force: false,
        errorOnExist: false,
      });
      await fs.promises.rm(backupStorage, { recursive: true, force: true });
    }

    if (hasEnvBackup) {
      await fs.promises.copyFile(backupEnv, targetEnv);
      await fs.promises.rm(backupEnv, { force: true });
    }

    await fs.promises.writeFile(marker, version);
  }

  ensureWritableBackend(target);
  return { dir: target, refreshed };
}

async function runMigrations(dir) {
  const php = findPhp();
  if (!php || !backendLog) return;
  backendLog.write(`[${new Date().toISOString()}] migration de la base…\n`);
  await new Promise((resolve) => {
    const child = spawn(php, ['artisan', 'migrate', '--force', '--no-interaction'], {
      cwd: dir,
      env: { ...process.env, APP_NO_INTERACTION: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      resolve();
    }, 30000);
    child.stdout.pipe(backendLog, { end: false });
    child.stderr.pipe(backendLog, { end: false });
    child.on('error', () => { clearTimeout(timer); resolve(); });
    child.on('exit', (code) => {
      clearTimeout(timer);
      backendLog?.write(`[${new Date().toISOString()}] migration terminée (code ${code}).\n`);
      resolve();
    });
  });
}

async function startBackend() {
  if (REMOTE_MODE) {
    // API distante : aucun serveur local à démarrer. On vérifie simplement
    // que le serveur de l'établissement répond, sans bloquer l'ouverture de
    // l'application si le réseau est lent — les erreurs s'afficheront dans
    // l'interface au moment de la connexion.
    const reachable = await probeApi(6000);
    logMain(reachable
      ? `API distante joignable : ${API_ORIGIN}`
      : `API distante injoignable pour l'instant : ${API_ORIGIN}`);
    return { reused: true, remote: true };
  }

  if (await probeApi()) {
    logMain('API locale déjà active — réutilisation.');
    return { reused: true };
  }

  openBackendLog();
  const { dir, refreshed } = await prepareBackend();
  backendLog.write(`[${new Date().toISOString()}] API locale : ${dir}\n`);
  logMain(`API locale : ${dir} (rafraîchie=${refreshed})`);

  if (refreshed && app.isPackaged) await runMigrations(dir);

  const php = findPhp();
  if (!php) {
    throw new Error('PHP est introuvable. Installez php-cli (sudo apt install php-cli).');
  }

  const router = path.join(
    dir, 'vendor', 'laravel', 'framework', 'src', 'Illuminate',
    'Foundation', 'resources', 'server.php',
  );
  if (!fs.existsSync(router)) {
    throw new Error('Les dépendances Laravel (vendor) sont absentes du paquet.');
  }

  const childEnv = {
    ...process.env,
    PHP_CLI_SERVER_WORKERS: process.env.PHP_CLI_SERVER_WORKERS || '4',
  };
  if (app.isPackaged) {
    childEnv.APP_ENV = process.env.APP_ENV || 'production';
    childEnv.APP_DEBUG = process.env.APP_DEBUG || 'false';
  }

  backend = spawn(
    php,
    ['-S', `127.0.0.1:${API_PORT}`, router],
    {
      cwd: path.join(dir, 'public'),
      env: childEnv,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: process.platform !== 'win32',
    },
  );

  backend.stdout.pipe(backendLog, { end: false });
  backend.stderr.pipe(backendLog, { end: false });
  backend.on('error', (error) => {
    if (backendLog && !backendLog.writableEnded) {
      backendLog.write(`[${new Date().toISOString()}] erreur process : ${error.message}\n`);
    }
  });
  backend.on('exit', (code, signal) => {
    if (backendLog && !backendLog.writableEnded) {
      backendLog.write(`[${new Date().toISOString()}] API arrêtée (code ${code}, signal ${signal}).\n`);
    }
    backend = null;
  });

  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    if (await probeApi(800)) return { reused: false };
    if (!backend) break;
    await delay(300);
  }

  throw new Error(`L'API locale n'a pas démarré. Consultez ${path.join(logDir(), 'backend.log')}.`);
}

function stopBackend() {
  if (!backend) return;
  const child = backend;
  backend = null;
  try {
    if (process.platform === 'win32') child.kill();
    else process.kill(-child.pid, 'SIGTERM');
  } catch {
    try { child.kill(); } catch { /* déjà arrêtée */ }
  }
  const timer = setTimeout(() => {
    try {
      if (process.platform === 'win32') child.kill('SIGKILL');
      else process.kill(-child.pid, 'SIGKILL');
    } catch { /* déjà arrêtée */ }
  }, 1500);
  timer.unref();
}

/* ------------------------------------------------------------------ */
/*  Connexion Google (OAuth desktop, boucle locale + PKCE)            */
/* ------------------------------------------------------------------ */

// Le secret Google reste dans l'API : Electron ouvre simplement le
// navigateur du poste, reçoit le code sur une boucle locale puis le
// transmet à l'API qui procède à l'échange et à la vérification.
const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_SCOPES = 'openid email profile';
const GOOGLE_REDIRECT_PORT = Number(process.env.KALANSO_GOOGLE_REDIRECT_PORT || 0);

function base64Url(buffer) {
  return buffer.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function requestJson(url, options) {
  const response = await fetch(url, options);
  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }
  return { ok: response.ok, status: response.status, payload };
}

function oauthPage(title, message, tone) {
  const color = tone === 'danger' ? '#ffb9b9' : '#a8e6c1';
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} — Kalanso</title>
  <style>
    :root { color-scheme: dark; }
    body {
      margin: 0; min-height: 100vh; display: grid; place-items: center;
      background: radial-gradient(720px 480px at 50% -10%, rgba(91,124,250,.22), transparent 68%), #070B1F;
      color: #e8ecff; font-family: "Inter", "Segoe UI", system-ui, sans-serif;
    }
    main { max-width: 460px; padding: 40px; text-align: center; }
    h1 { font-size: 22px; letter-spacing: -0.02em; margin: 0 0 10px; color: ${color}; }
    p { margin: 0; font-size: 13px; line-height: 1.6; color: #9aa6d8; }
    .hint { margin-top: 18px; font-family: ui-monospace, Menlo, monospace; font-size: 9px; letter-spacing: .16em; text-transform: uppercase; color: #4f5a86; }
  </style>
</head>
<body>
  <main>
    <h1>${title}</h1>
    <p>${message}</p>
    <p class="hint">Vous pouvez fermer cet onglet et revenir à Kalanso.</p>
  </main>
</body>
</html>`;
}

let cancelGoogleFlow = null;

async function googleSignInFlow() {
  const status = await requestJson(`${API_ORIGIN}/api/auth/google/status`);
  const clientId = status.payload?.client_id;

  if (!status.ok || !status.payload?.enabled || !clientId) {
    throw new Error(
      'La connexion Google n’est pas activée sur l’API. '
      + 'Renseignez GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET dans le fichier .env de l’API, puis réessayez.',
    );
  }

  const state = base64Url(crypto.randomBytes(32));
  const codeVerifier = base64Url(crypto.randomBytes(64));
  const codeChallenge = base64Url(crypto.createHash('sha256').update(codeVerifier).digest());

  const server = http.createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(GOOGLE_REDIRECT_PORT, '127.0.0.1', resolve);
  });

  const { port } = server.address();
  const redirectUri = `http://127.0.0.1:${port}/oauth/callback`;

  const authUrl = new URL(GOOGLE_AUTH_ENDPOINT);
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', GOOGLE_SCOPES);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');
  authUrl.searchParams.set('prompt', 'select_account');

  logMain(`connexion Google — attente du navigateur sur ${redirectUri}`);

  let abort = () => {};
  const codePromise = new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error, code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      server.close();
      if (error) reject(error);
      else resolve(code);
    };
    const timer = setTimeout(
      () => finish(new Error('Délai dépassé : la connexion Google n’a pas abouti.')),
      5 * 60 * 1000,
    );
    abort = () => finish(new Error('Ouverture du navigateur impossible.'));

    server.on('request', (request, response) => {
      const requestUrl = new URL(request.url, `http://127.0.0.1:${port}`);

      if (requestUrl.pathname !== '/oauth/callback') {
        response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end('Introuvable');
        return;
      }

      const receivedState = requestUrl.searchParams.get('state');
      const error = requestUrl.searchParams.get('error');
      const code = requestUrl.searchParams.get('code');
      const send = (title, message, tone) => {
        response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        response.end(oauthPage(title, message, tone));
      };

      if (error) {
        send('Connexion annulée', 'Google a interrompu la connexion.', 'danger');
        finish(new Error('Connexion Google annulée.'));
        return;
      }

      if (!code || receivedState !== state) {
        send('Réponse invalide', 'Kalanso n’a pas pu vérifier la réponse de Google.', 'danger');
        finish(new Error('Réponse Google invalide.'));
        return;
      }

      send('Connexion réussie', 'Votre compte Google est vérifié.', 'success');
      finish(null, code);
    });
  });
  // Évite un rejet non géré si l'ouverture du navigateur échoue avant l'attente.
  codePromise.catch(() => {});
  cancelGoogleFlow = abort;

  try {
    await shell.openExternal(authUrl.toString());
    const code = await codePromise;

    const exchange = await requestJson(`${API_ORIGIN}/api/auth/google/exchange`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        code_verifier: codeVerifier,
        redirect_uri: redirectUri,
        state,
      }),
    });

    if (!exchange.ok) {
      const firstError = exchange.payload?.errors
        ? Object.values(exchange.payload.errors)[0]?.[0]
        : null;
      throw new Error(firstError || exchange.payload?.message || 'Connexion Google refusée.');
    }

    return exchange.payload;
  } catch (error) {
    abort();
    throw error;
  } finally {
    cancelGoogleFlow = null;
    if (server.listening) server.close();
  }
}

/* ------------------------------------------------------------------ */
/*  Mises à jour                                                      */
/* ------------------------------------------------------------------ */

// Canal de mise à jour : variable d'environnement KALANSO_UPDATE_URL ou,
// sinon, la même clé lue dans le .env du backend installé. Il doit pointer
// vers un dossier ou un serveur contenant latest-linux.yml et les paquets.
function updateFeedUrl() {
  const fromEnv = String(process.env.KALANSO_UPDATE_URL || '').trim();
  if (fromEnv) return fromEnv;

  try {
    const envPath = path.join(app.isPackaged ? apiCacheDir() : apiSourceDir(), '.env');
    const content = fs.readFileSync(envPath, 'utf8');
    const match = content.match(/^\s*KALANSO_UPDATE_URL\s*=\s*"?([^"\n\r]+?)"?\s*$/m);
    if (match && match[1].trim()) return match[1].trim();
  } catch {
    /* fichier .env absent */
  }

  return null;
}

function sendUpdateStatus(status) {
  if (win && !win.isDestroyed()) win.webContents.send('update:status', status);
  logMain(
    `mise à jour : ${status.state}`
    + `${status.version ? ` ${status.version}` : ''}`
    + `${status.percent != null ? ` ${status.percent}%` : ''}`
    + `${status.message ? ` — ${status.message}` : ''}`,
  );
}

let updaterReady = false;

function setupUpdater() {
  if (updaterReady) return;
  updaterReady = true;

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.logger = {
    info: (message) => logMain(`updater: ${message}`),
    warn: (message) => logMain(`updater warn: ${message}`),
    error: (message) => logMain(`updater error: ${message}`),
    debug: () => {},
  };

  const feed = updateFeedUrl();
  if (feed) {
    autoUpdater.setFeedURL({ provider: 'generic', url: feed });
    logMain(`canal de mise à jour : ${feed}`);
  }

  autoUpdater.on('checking-for-update', () => {
    sendUpdateStatus({ state: 'checking', version: app.getVersion() });
  });
  autoUpdater.on('update-available', (info) => {
    sendUpdateStatus({
      state: 'available',
      version: info?.version,
      notes: info?.releaseNotes || '',
      date: info?.releaseDate || '',
    });
  });
  autoUpdater.on('update-not-available', (info) => {
    sendUpdateStatus({ state: 'not-available', version: app.getVersion(), latest: info?.version });
  });
  autoUpdater.on('download-progress', (progress) => {
    sendUpdateStatus({
      state: 'downloading',
      percent: Math.round(progress?.percent || 0),
      transferred: progress?.transferred,
      total: progress?.total,
    });
  });
  autoUpdater.on('update-downloaded', (info) => {
    sendUpdateStatus({ state: 'downloaded', version: info?.version });
  });
  autoUpdater.on('error', (error) => {
    sendUpdateStatus({ state: 'error', message: error?.message || String(error) });
  });
}

/* ------------------------------------------------------------------ */
/*  Fenêtre                                                           */
/* ------------------------------------------------------------------ */

// Ramène la fenêtre au premier plan. Sous GNOME/Mutter, `focus()` seul peut
// être ignoré quand l'application est lancée depuis un terminal : la fenêtre
// reste alors cachée derrière la fenêtre active. moveTop() + un passage
// temporaire en always-on-top garantissent qu'elle devient visible.
function bringToFront() {
  if (!win || win.isDestroyed()) return;
  if (win.isMinimized()) win.restore();
  win.show();
  win.moveTop();
  win.focus();
  if (process.platform === 'linux') {
    win.setAlwaysOnTop(true, 'floating');
    setTimeout(() => {
      if (!win || win.isDestroyed()) return;
      win.setAlwaysOnTop(false);
      win.focus();
    }, 350);
  }
}

function createWindow() {
  win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1080,
    minHeight: 700,
    show: true,
    frame: false,
    transparent: false,
    backgroundColor: '#070B1F',
    icon: fs.existsSync(ICON) ? ICON : undefined,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
    trafficLightPosition: { x: 16, y: 20 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });

  logMain('fenêtre créée — affichage de l’écran de démarrage.');

  win.loadFile(SPLASH_PAGE).catch((error) => {
    if (error.code === 'ERR_ABORTED') return; // navigation vers l'interface déjà lancée
    logMain(`échec du splash : ${error.message}`);
    if (win && !win.isDestroyed()) win.show();
  });
  bringToFront();

  win.webContents.on('did-finish-load', () => {
    logMain(`page chargée : ${win?.webContents.getURL() || '?'}`);
  });
  win.webContents.on('did-fail-load', (_event, code, description, url) => {
    logMain(`échec de chargement (${code} ${description}) : ${url}`);
  });
  win.webContents.on('render-process-gone', (_event, details) => {
    logMain(`processus de rendu arrêté : ${JSON.stringify(details)}`);
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  win.on('maximize', () => win?.webContents.send('window:state', { maximized: true }));
  win.on('unmaximize', () => win?.webContents.send('window:state', { maximized: false }));
  win.on('closed', () => { win = null; });

  if (isDev) {
    // Repère visuel : la version de développement peut tourner en même temps
    // que l'application installée.
    win.on('page-title-updated', (event, title) => {
      event.preventDefault();
      if (win && !win.isDestroyed()) win.setTitle(`${title} · dev`);
    });
    // Les outils de développement sont optionnels pour ne pas masquer
    // l'interface à chaque lancement : KALANSO_DEVTOOLS=1 pour les ouvrir.
    if (process.env.KALANSO_DEVTOOLS === '1') {
      win.webContents.openDevTools({ mode: 'detach' });
    }
  }
}

async function loadRenderer() {
  if (!win || win.isDestroyed()) return;
  if (isDev) {
    await win.loadURL(DEV_SERVER_URL);
    return;
  }
  const index = app.isPackaged ? PACKAGED_APP_INDEX : SOURCE_APP_INDEX;
  if (fs.existsSync(index)) await win.loadFile(index);
  else await win.loadFile(GALLERY_INDEX);
}

async function boot() {
  logMain('boot — création de la fenêtre.');
  Menu.setApplicationMenu(null);
  createWindow();

  try {
    const { reused } = await startBackend();
    backendLog?.write(`[${new Date().toISOString()}] service ${reused ? 'déjà actif' : 'prêt'}.\n`);
    logMain(`service ${reused ? 'déjà actif' : 'prêt'}.`);
  } catch (error) {
    backendLog?.write(`[${new Date().toISOString()}] ÉCHEC : ${error.stack || error.message}\n`);
    logMain(`ÉCHEC du service local : ${error.stack || error.message}`);
    if (quitting) return;
    const message = {
      type: 'error',
      title: 'Service local indisponible',
      message: "L'API locale n'a pas pu démarrer.",
      detail: (process.platform === 'win32'
        ? `${error.message}\n\nSur Windows, installez PHP 8.2+ et MySQL/MariaDB `
          + '(par exemple avec XAMPP), puis démarrez MySQL.\n\n'
          + `Configuration et accès à la base : ${path.join(apiCacheDir(), '.env')}`
        : `${error.message}\n\nVérifiez que PHP et MariaDB sont installés et démarrés :\n`
          + 'sudo apt install php-cli mariadb-server\nsudo systemctl start mariadb\n\n'
          + `Configuration et accès à la base : ${path.join(apiCacheDir(), '.env')}`)
        + "\n\nAstuce : pour utiliser le serveur de l'établissement sans PHP local, "
          + 'ouvrez Paramètres → Serveur de données (réservé au créateur) et saisissez '
          + 'https://kalanso.mandenbaoubab.com.',
      buttons: ['Continuer', 'Quitter'],
      defaultId: 0,
      cancelId: 1,
      noLink: true,
    };
    const { response } = win && !win.isDestroyed()
      ? await dialog.showMessageBox(win, message)
      : await dialog.showMessageBox(message);
    if (response === 1) {
      app.quit();
      return;
    }
  }

  if (quitting) return;
  try {
    await loadRenderer();
    logMain(`interface chargée : ${win?.webContents.getURL() || '?'}`);
    bringToFront();
  } catch (error) {
    logMain(`échec de l’interface : ${error.stack || error.message}`);
    dialog.showErrorBox('Kalanso', `Impossible d'ouvrir l'interface.\n\n${error.message}`);
  }
}

/* ------------------------------------------------------------------ */
/*  Cycle de vie                                                      */
/* ------------------------------------------------------------------ */

const hasLock = app.requestSingleInstanceLock();
if (!hasLock) {
  logMain('une autre instance est déjà active — sortie de cette instance.');
  app.quit();
} else {
  app.on('second-instance', () => {
    logMain('seconde instance demandée — focus sur la fenêtre existante.');
    bringToFront();
  });

  app.whenReady().then(boot);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) boot();
  });

  app.on('before-quit', () => {
    quitting = true;
    stopBackend();
    backendLog?.end();
    logMain('arrêt demandé.');
  });

  app.on('window-all-closed', () => {
    stopBackend();
    if (process.platform !== 'darwin') app.quit();
  });
}

/* ------------------------------------------------------------------ */
/*  IPC fenêtre                                                       */
/* ------------------------------------------------------------------ */

ipcMain.on('window:minimize', () => win?.minimize());
ipcMain.on('window:toggleMaximize', () => {
  if (!win) return;
  win.isMaximized() ? win.unmaximize() : win.maximize();
});
ipcMain.on('window:close', () => win?.close());

ipcMain.handle('google:signIn', async () => {
  try {
    const session = await googleSignInFlow();
    return {
      ok: true,
      token: session.token,
      user: session.user,
      first_account: Boolean(session.first_account),
    };
  } catch (error) {
    logMain(`connexion Google impossible : ${error.message}`);
    return { ok: false, message: error.message };
  }
});

ipcMain.handle('google:cancel', () => {
  if (!cancelGoogleFlow) {
    return { ok: false, message: 'Aucune connexion Google en cours.' };
  }
  cancelGoogleFlow();
  cancelGoogleFlow = null;
  return { ok: true };
});

/* Adresse de l'API effective, lue une fois par le preload (sendSync). */
ipcMain.on('api:url', (event) => {
  event.returnValue = `${API_ORIGIN}/api`;
});

ipcMain.handle('api:info', () => ({
  remote: REMOTE_MODE,
  origin: API_ORIGIN,
  apiUrl: `${API_ORIGIN}/api`,
}));

/* Change le serveur de données (API distante ou locale) puis redémarre. */
ipcMain.handle('api:setUrl', (_event, value) => {
  const normalized = normalizeRemoteUrl(value);
  if (normalized && !/^https?:\/\//i.test(normalized)) {
    return { ok: false, message: "L'adresse doit commencer par http:// ou https://" };
  }

  const dir = app.isPackaged ? apiCacheDir() : apiSourceDir();
  try {
    fs.mkdirSync(dir, { recursive: true });
    ensureEnvFile(dir);
    const envPath = path.join(dir, '.env');
    let content = fs.readFileSync(envPath, 'utf8');
    const line = `KALANSO_REMOTE_API_URL=${normalized}`;
    if (/^KALANSO_REMOTE_API_URL=.*$/m.test(content)) {
      content = content.replace(/^KALANSO_REMOTE_API_URL=.*$/m, line);
    } else {
      content = `${content.replace(/\s*$/, '')}\n\n# API distante (laisser vide pour utiliser l'API de cet ordinateur)\n${line}\n`;
    }
    fs.writeFileSync(envPath, content);
  } catch (error) {
    logMain(`enregistrement du serveur impossible : ${error.message}`);
    return { ok: false, message: "Impossible d'enregistrer la configuration." };
  }

  logMain(`serveur de données : ${normalized || 'API locale'} — redémarrage.`);
  app.relaunch();
  quitting = true;
  app.quit();
  return { ok: true };
});

/* ------------------------------------------------------------------ */
/*  Impression de documents PDF (bulletins, reçus)                     */
/* ------------------------------------------------------------------ */

// Fenêtre cachée persistante : la détruire puis la recréer dans le même
// process peut faire échouer le chargement suivant (ERR_FAILED).
let printWindow = null;
let pdfBusy = false;

function getPrintWindow() {
  if (printWindow && !printWindow.isDestroyed()) return printWindow;
  printWindow = new BrowserWindow({
    show: false,
    webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false },
  });
  printWindow.on('closed', () => { printWindow = null; });
  return printWindow;
}

// Le renderer construit le HTML (mise en page A4), ici on imprime et on
// propose l'emplacement d'enregistrement.
ipcMain.handle('pdf:save', async (_event, payload) => {
  if (pdfBusy) return { ok: false, message: 'Une génération est déjà en cours.' };

  const sentFilename = path.basename(String(payload?.filename || 'document.pdf'))
    .replace(/[^\w.\- ]+/g, '_');
  const filename = /\.pdf$/i.test(sentFilename) ? sentFilename : `${sentFilename}.pdf`;
  const html = String(payload?.html || '');
  if (!html.trim()) return { ok: false, message: 'Document vide.' };

  pdfBusy = true;
  const tmp = path.join(app.getPath('userData'), `document-${process.pid}-${Date.now()}.html`);
  try {
    await fs.promises.writeFile(tmp, html, 'utf8');
    const hidden = getPrintWindow();
    await Promise.race([
      hidden.loadFile(tmp),
      new Promise((_, reject) => setTimeout(
        () => reject(new Error('Le chargement du document a dépassé le délai.')),
        20000,
      )),
    ]);
    const pdf = await hidden.webContents.printToPDF({
      pageSize: 'A4',
      printBackground: true,
      margins: { marginType: 'none' },
    });
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Enregistrer le document',
      defaultPath: path.join(app.getPath('documents'), filename),
      filters: [{ name: 'Document PDF', extensions: ['pdf'] }],
    });
    if (canceled || !filePath) return { ok: false, canceled: true };
    await fs.promises.writeFile(filePath, pdf);
    logMain(`PDF enregistré : ${filePath}`);
    return { ok: true, path: filePath };
  } catch (error) {
    logMain(`génération PDF impossible : ${error.stack || error.message}`);
    return { ok: false, message: error.message || 'Génération du PDF impossible.' };
  } finally {
    pdfBusy = false;
    fs.promises.unlink(tmp).catch(() => {});
  }
});

ipcMain.handle('update:version', () => app.getVersion());

ipcMain.handle('update:check', async () => {
  if (!app.isPackaged) {
    return {
      ok: false,
      message: 'Les mises à jour sont disponibles dans l’application installée.',
    };
  }

  setupUpdater();
  try {
    const result = await autoUpdater.checkForUpdates();
    const info = result?.updateInfo;
    const available = Boolean(info?.version && info.version !== app.getVersion());

    return {
      ok: true,
      available,
      version: app.getVersion(),
      latest: info?.version || app.getVersion(),
      notes: info?.releaseNotes || '',
    };
  } catch (error) {
    logMain(`vérification de mise à jour impossible : ${error.message}`);
    return { ok: false, message: error.message };
  }
});

ipcMain.handle('update:download', async () => {
  if (!app.isPackaged) {
    return { ok: false, message: 'Les mises à jour sont disponibles dans l’application installée.' };
  }

  setupUpdater();
  try {
    await autoUpdater.downloadUpdate();
    return { ok: true };
  } catch (error) {
    logMain(`téléchargement de mise à jour impossible : ${error.message}`);
    return { ok: false, message: error.message };
  }
});

ipcMain.handle('update:install', () => {
  if (!app.isPackaged) {
    return { ok: false, message: 'Les mises à jour sont disponibles dans l’application installée.' };
  }

  try {
    quitting = true;
    autoUpdater.quitAndInstall(false, true);
    return { ok: true };
  } catch (error) {
    logMain(`installation de mise à jour impossible : ${error.message}`);
    return { ok: false, message: error.message };
  }
});
