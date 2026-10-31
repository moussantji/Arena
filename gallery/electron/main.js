// DIALLO — Electron main process
// Fenêtre sans cadre, contexte isolé et service Laravel local démarré
// automatiquement pour que l'application fonctionne comme une vraie app PC.
const {
  app, BrowserWindow, Menu, dialog, ipcMain, shell,
} = require('electron');
const { execFileSync, spawn } = require('node:child_process');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const isDev = process.argv.includes('--dev');

// Le mode développement utilise son propre profil : il peut ainsi tourner en
// même temps que l'application installée sans se heurter au verrou d'instance
// unique d'Electron. Les deux fenêtres partagent en revanche la même API.
if (isDev) {
  const devProfile = process.env.DIALLO_DEV_PROFILE
    || path.join(app.getPath('appData'), 'diallo-desktop-dev');
  app.setPath('userData', devProfile);
}

const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5179';
const API_PORT = Number(process.env.ARENA_API_PORT || 8001);
const API_ORIGIN = `http://127.0.0.1:${API_PORT}`;
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
// application de bureau. DIALLO_GPU=1 permet de réactiver le GPU.
if (process.platform === 'linux' && process.env.DIALLO_GPU !== '1') {
  app.disableHardwareAcceleration();
}

logMain(
  `--- démarrage ${app.getVersion()} · packaged=${app.isPackaged} · `
  + `display=${process.env.DISPLAY || '?'} · session=${process.env.XDG_SESSION_TYPE || '?'}`
  + `${isDev ? ` · mode=dev · profil=${app.getPath('userData')}` : ''} ---`,
);

process.on('uncaughtException', (error) => {
  logMain(`uncaughtException: ${error.stack || error.message}`);
  if (app.isReady()) {
    dialog.showErrorBox('DIALLO', `Erreur inattendue au démarrage.\n\n${error.message}`);
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
  backendLog.write(`\n[${new Date().toISOString()}] --- lancement DIALLO ---\n`);
  return logPath;
}

function probeApi(timeout = 1200) {
  return new Promise((resolve) => {
    const request = http.get(`${API_ORIGIN}/api/health`, { timeout }, (response) => {
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
  const candidates = [process.env.ARENA_PHP_BIN, '/usr/bin/php', '/usr/local/bin/php'].filter(Boolean);
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
  const link = path.join(target, 'public', 'storage');
  try {
    const stat = fs.lstatSync(link);
    if (stat.isDirectory() && !stat.isSymbolicLink()) fs.rmSync(link, { recursive: true, force: true });
    else fs.unlinkSync(link);
  } catch {
    /* lien absent */
  }
  fs.symlinkSync(path.join('..', 'storage', 'app', 'public'), link, 'dir');

  if (!fs.existsSync(path.join(target, '.env'))) {
    throw new Error('Configuration .env absente du paquet API.');
  }
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
    // l'interface à chaque lancement : DIALLO_DEVTOOLS=1 pour les ouvrir.
    if (process.env.DIALLO_DEVTOOLS === '1') {
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
      detail: `${error.message}\n\nVérifiez que PHP et MariaDB sont installés et démarrés :\n`
        + 'sudo apt install php-cli mariadb-server\nsudo systemctl start mariadb',
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
    dialog.showErrorBox('DIALLO', `Impossible d'ouvrir l'interface.\n\n${error.message}`);
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
