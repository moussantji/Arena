// DIALLO — Electron main process
// Fenêtre sans cadre (les feux de circulation sont dessinés dans le renderer),
// contexte isolé, pas d'accès Node depuis le renderer.
const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('node:path');

const isDev = process.argv.includes('--dev');
let win = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1080,
    minHeight: 700,
    show: false,
    frame: false,
    transparent: false,
    backgroundColor: '#070B1F',
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

  // Le renderer est la même page que la galerie web (une seule source de vérité).
  win.loadFile(path.join(__dirname, '..', 'index.html'));

  win.once('ready-to-show', () => win.show());

  // Liens externes hors application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  win.on('maximize', () => win.webContents.send('window:state', { maximized: true }));
  win.on('unmaximize', () => win.webContents.send('window:state', { maximized: false }));

  if (isDev) win.webContents.openDevTools({ mode: 'detach' });

  win.on('closed', () => { win = null; });
}

// --- IPC fenêtre ---
ipcMain.on('window:minimize', () => win?.minimize());
ipcMain.on('window:toggleMaximize', () => {
  if (!win) return;
  win.isMaximized() ? win.unmaximize() : win.maximize();
});
ipcMain.on('window:close', () => win?.close());

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
