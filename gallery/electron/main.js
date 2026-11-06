// Kalanso — Electron main process
// Fenêtre sans cadre, contexte isolé. L'application se connecte
// exclusivement au serveur de l'établissement : aucun serveur Laravel
// n'est embarqué ni démarré sur le poste.
const {
  app, BrowserWindow, Menu, dialog, ipcMain, shell,
} = require('electron');
const { autoUpdater } = require('electron-updater');
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
 * API de l'établissement (seul serveur supporté) :
 * vide/absent = https://kalanso.mandenbaoubab.com ;
 * « local »    = http://127.0.0.1:8001 (développement, PHP démarré à la main) ;
 * toute autre adresse http(s) remplace le serveur.
 *
 * Aucune API n'est embarquée ni démarrée par l'application.
 */
const DEFAULT_REMOTE_API = 'https://kalanso.mandenbaoubab.com';
const LOCAL_SENTINEL = 'local';

function isLocalSentinel(value) {
  return String(value || '').trim().toLowerCase() === LOCAL_SENTINEL;
}

function normalizeRemoteUrl(value) {
  return String(value || '').trim().replace(/\/+$/, '').replace(/\/api$/i, '');
}

function remoteApiUrl() {
  const fromEnv = normalizeRemoteUrl(process.env.KALANSO_REMOTE_API_URL);
  if (fromEnv) return isLocalSentinel(fromEnv) ? null : fromEnv;

  try {
    const envPath = configEnvPath();
    const content = fs.readFileSync(envPath, 'utf8');
    const match = content.match(/^\s*KALANSO_REMOTE_API_URL\s*=\s*"?([^"\n\r]*?)"?\s*$/m);
    if (match) {
      const raw = match[1].trim();
      if (!raw || isLocalSentinel(raw)) return raw ? null : DEFAULT_REMOTE_API;
      return normalizeRemoteUrl(raw);
    }
  } catch {
    /* fichier .env absent */
  }

  return DEFAULT_REMOTE_API;
}

const REMOTE_API_URL = remoteApiUrl();
const API_ORIGIN = REMOTE_API_URL || LOCAL_API_ORIGIN;
const REMOTE_MODE = Boolean(REMOTE_API_URL);   // false uniquement avec « local »
const SOURCE_APP_INDEX = path.join(__dirname, '..', '..', 'app', 'dist', 'index.html');
const PACKAGED_APP_INDEX = path.join(process.resourcesPath, 'app', 'index.html');
const GALLERY_INDEX = path.join(__dirname, '..', 'index.html');
const SPLASH_PAGE = path.join(__dirname, 'splash.html');
const ICON = path.join(__dirname, 'build', 'icon.png');
const LOG_DIR = path.join(app.getPath('userData'), 'logs');

let win = null;
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
logMain(`serveur : ${API_ORIGIN}`);

process.on('uncaughtException', (error) => {
  logMain(`uncaughtException: ${error.stack || error.message}`);
  if (app.isReady()) {
    dialog.showErrorBox('Kalanso', `Erreur inattendue au démarrage.\n\n${error.message}`);
  }
});

process.on('unhandledRejection', (reason) => {
  logMain(`unhandledRejection: ${reason?.stack || reason}`);
});

// Arrêt demandé par le système ou par le lanceur de développement :
// passer par app.quit() pour déclencher before-quit proprement.
function requestQuit(signal) {
  logMain(`signal ${signal} reçu — arrêt.`);
  if (app.isReady()) app.quit();
  else app.exit(0);
}
process.on('SIGTERM', () => requestQuit('SIGTERM'));
process.on('SIGINT', () => requestQuit('SIGINT'));


/* ------------------------------------------------------------------ */
/*  Serveur de l'établissement (aucune API embarquée)                 */
/* ------------------------------------------------------------------ */

// Configuration du serveur lue par poste (KALANSO_REMOTE_API_URL).
// Le fichier userData/backend/.env des installations existantes est
// conservé tel quel (il peut contenir les identifiants Google) ; les
// nouvelles installations utilisent userData/config/.env.
const LEGACY_CONFIG_DIR = path.join(app.getPath('userData'), 'backend');
const CONFIG_DIR = path.join(app.getPath('userData'), 'config');

function configEnvPath() {
  const legacy = path.join(LEGACY_CONFIG_DIR, '.env');
  if (fs.existsSync(legacy)) return legacy;

  return path.join(CONFIG_DIR, '.env');
}

function ensureConfigFile() {
  if (fs.existsSync(path.join(CONFIG_DIR, '.env'))) return;
  if (fs.existsSync(path.join(LEGACY_CONFIG_DIR, '.env'))) return;

  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(CONFIG_DIR, '.env'),
    ['# Kalanso — serveur de données',
     '# Vide = serveur de l\'établissement ; « local » = http://127.0.0.1:8001',
     'KALANSO_REMOTE_API_URL=',
     ''].join('\n'),
  );
}

// Vérification de joignabilité du serveur (non bloquante) :
// l'interface gère l'état hors-ligne toute seule (bandeau + Réessayer).
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

async function probeServer() {
  const reachable = await probeApi(6000);
  logMain(reachable
    ? `serveur joignable : ${API_ORIGIN}`
    : `serveur injoignable pour l'instant : ${API_ORIGIN}`);
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
// sinon, la même clé lue dans le fichier de configuration du poste. Il doit
// pointer vers un dossier ou un serveur contenant latest-linux.yml et les paquets.
function updateFeedUrl() {
  const fromEnv = String(process.env.KALANSO_UPDATE_URL || '').trim();
  if (fromEnv) return fromEnv;

  try {
    const envPath = configEnvPath();
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
    await probeServer();
  } catch (error) {
    // La sonde ne bloque jamais l'ouverture : l'interface affiche son
    // bandeau « hors-ligne » si le serveur ne répond pas.
    logMain(`sonde serveur impossible : ${error.stack || error.message}`);
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
    logMain('arrêt demandé.');
  });

  app.on('window-all-closed', () => {
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

/* Change le serveur de données (API distante, locale ou défaut production) puis redémarre. */
ipcMain.handle('api:setUrl', (_event, value) => {
  const raw = String(value || '').trim();
  const normalized = isLocalSentinel(raw) ? 'local' : normalizeRemoteUrl(raw);
  if (normalized && normalized !== 'local' && !/^https?:\/\//i.test(normalized)) {
    return { ok: false, message: "L'adresse doit commencer par http:// ou https:// (ou « local » pour l'API de développement)" };
  }

  try {
    ensureConfigFile();
    const envPath = configEnvPath();
    let content = fs.readFileSync(envPath, 'utf8');
    const line = `KALANSO_REMOTE_API_URL=${normalized}`;
    if (/^KALANSO_REMOTE_API_URL=.*$/m.test(content)) {
      content = content.replace(/^KALANSO_REMOTE_API_URL=.*$/m, line);
    } else {
      content = `${content.replace(/\s*$/, '')}\n\n# Vide = serveur de l'établissement ; « local » = API locale de développement\n${line}\n`;
    }
    fs.writeFileSync(envPath, content);
  } catch (error) {
    logMain(`enregistrement du serveur impossible : ${error.message}`);
    return { ok: false, message: "Impossible d'enregistrer la configuration." };
  }

  logMain(`serveur de données : ${normalized === 'local' ? 'API locale (développement)' : normalized || DEFAULT_REMOTE_API} — redémarrage.`);
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
