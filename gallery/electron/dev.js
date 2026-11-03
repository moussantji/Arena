#!/usr/bin/env node
'use strict';

// Kalanso — lancement en mode développement.
//
// Réutilise le serveur Vite s'il tourne déjà sur le port 5179, sinon le
// démarre. Electron est ensuite ouvert avec le profil « kalanso-desktop-dev » :
// la version de développement peut donc tourner en même temps que
// l'application installée, sans conflit de verrou Electron.
//
// Les modifications React/CSS sont appliquées à chaud (HMR). Les modifications
// de main.js ou preload.js nécessitent de relancer cette commande.

const { spawn } = require('node:child_process');
const http = require('node:http');
const path = require('node:path');

const ELECTRON_DIR = __dirname;
const APP_DIR = path.join(ELECTRON_DIR, '..', '..', 'app');
const HOST = process.env.KALANSO_DEV_HOST || '127.0.0.1';
const PORT = Number(process.env.KALANSO_DEV_PORT || 5179);
const URL = `http://${HOST}:${PORT}`;

let vite = null;
let electron = null;
let stopping = false;

function probe(timeout = 800) {
  return new Promise((resolve) => {
    const request = http.get(URL, { timeout }, (response) => {
      response.resume();
      resolve(response.statusCode >= 200 && response.statusCode < 500);
    });
    request.on('timeout', () => { request.destroy(); resolve(false); });
    request.on('error', () => resolve(false));
  });
}

const delay = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

async function waitForVite(timeout = 40000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await probe()) return true;
    await delay(300);
  }
  return false;
}

function stopChild(child, signal = 'SIGTERM') {
  if (!child || child.killed) return;
  try {
    if (process.platform === 'win32') child.kill(signal);
    else process.kill(-child.pid, signal);
  } catch {
    try { child.kill(signal); } catch { /* déjà arrêté */ }
  }
}

function shutdown(code = 0) {
  if (stopping) return;
  stopping = true;
  if (electron) stopChild(electron);
  if (vite) stopChild(vite);
  setTimeout(() => process.exit(code), 800);
}

async function main() {
  console.log(`Kalanso — mode développement (${URL})`);

  if (await probe()) {
    console.log('• serveur Vite déjà actif, réutilisation.');
  } else {
    console.log('• démarrage du serveur Vite…');
    vite = spawn('npm', ['run', 'dev', '--', '--port', String(PORT), '--strictPort'], {
      cwd: APP_DIR,
      env: {
        ...process.env,
        VITE_API_URL: process.env.VITE_API_URL || 'http://127.0.0.1:8001/api',
      },
      stdio: 'inherit',
      detached: process.platform !== 'win32',
    });
    vite.on('exit', (code, signal) => {
      if (stopping) return;
      console.error(`Le serveur Vite s'est arrêté (${code ?? signal}).`);
      shutdown(code || 1);
    });
    if (!(await waitForVite())) {
      console.error('Le serveur Vite ne répond pas. Vérifiez les messages ci-dessus.');
      shutdown(1);
      return;
    }
    console.log('• serveur Vite prêt.');
  }

  const electronPath = require('electron');
  electron = spawn(electronPath, ['.', '--dev', '--no-sandbox'], {
    cwd: ELECTRON_DIR,
    env: { ...process.env, VITE_DEV_SERVER_URL: URL },
    stdio: 'inherit',
    detached: process.platform !== 'win32',
  });
  electron.on('exit', (code) => {
    console.log(`• Electron fermé (${code ?? 0}).`);
    shutdown(code || 0);
  });
  electron.on('error', (error) => {
    console.error(`Impossible de lancer Electron : ${error.message}`);
    shutdown(1);
  });
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

main().catch((error) => {
  console.error(error.stack || error.message);
  shutdown(1);
});
