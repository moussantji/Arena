// Kalanso — configuration electron-builder
//
// Deux objectifs :
//  1. Un paquet léger : les dépendances de **développement** de l'API
//     Laravel (phpunit, faker…) ne sont pas embarquées — elles pèsent
//     ~20 Mo et l'application n'en a pas besoin en production. La liste
//     est calculée depuis `api/composer.lock` à chaque build ; la fermeture
//     transitive des paquets de production est conservée telle quelle.
//  2. Aucun fichier privé : `api/storage/**` (photos et documents saisis
//     sur le poste de build) et les caches ne sont jamais embarqués.
//     Les dossiers requis sont recréés à l'installation
//     (`ensureWritableBackend`).
//
// electron-builder lit ce fichier à la place de la clé « build » de
// package.json — toute la configuration y vit désormais.

const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.join(__dirname, '..', '..');

/**
 * Paquets Composer à exclure du paquet : tous les paquets de développement
 * qui ne sont pas requis (transitivement) par un paquet de production.
 */
function composerDevExclusions() {
  try {
    const lockPath = path.join(rootDir, 'api', 'composer.lock');
    const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));

    const production = lock.packages || [];
    const development = lock['packages-dev'] || [];
    const universe = new Map(
      [...production, ...development].map((pkg) => [pkg.name, pkg]),
    );

    // Fermeture transitive des dépendances de production.
    const needed = new Set();
    const stack = production.map((pkg) => pkg.name);
    while (stack.length) {
      const name = stack.pop();
      if (needed.has(name) || !universe.has(name)) continue;
      needed.add(name);
      for (const required of Object.keys(universe.get(name).require || {})) {
        if (universe.has(required) && !needed.has(required)) stack.push(required);
      }
    }

    return development
      .map((pkg) => pkg.name)
      .filter((name) => !needed.has(name))
      .map((name) => `!vendor/${name}/**`);
  } catch (error) {
    console.warn(
      `[electron-builder] composer.lock illisible (${error.message}) — `
      + 'le vendor est embarqué tel quel.',
    );
    return [];
  }
}

const apiFilter = [
  '**/*',
  // Tests et outils, jamais exécutés en production
  '!tests/**',
  '!phpunit.xml',
  '!.phpunit.result.cache',
  '!.phpunit.cache/**',
  '!README.md',
  '!AGENTS.md',
  '!CLAUDE.md',
  '!composer.json',
  '!composer.lock',
  '!package.json',
  '!vite.config.js',
  '!.gitattributes',
  '!.npmrc',
  // Fichiers propres à un poste ou à la machine de build
  '!.env',
  '!.env.local',
  '!.env.*.local',
  '!storage/**',
  '!bootstrap/cache/*.php',
  '!database/*.sqlite*',
  // Lien symbolique de dev (recréé à l'installation)
  '!public/storage',
  // Outils de développement présents sur le disque mais absents du dépôt
  '!.agents/**',
  '!.claude/**',
  '!.pi/**',
  '!.cursor/**',
  '!.mcp.json',
  '!boost.json',
  '!opencode.json',
  '!.git/**',
  '!node_modules/**',
  // Vendor de production uniquement
  '!vendor/bin/**',
  ...composerDevExclusions(),
];

module.exports = {
  appId: 'com.kalanso.desktop',
  productName: 'Kalanso',
  artifactName: 'Kalanso-${version}-${arch}.${ext}',
  asar: true,
  compression: 'normal',
  npmRebuild: false,
  directories: {
    output: '../../release',
    buildResources: 'build',
  },
  files: [
    'main.js',
    'preload.js',
    'splash.html',
    'build/icon.png',
    'package.json',
  ],
  publish: [
    {
      provider: 'github',
      owner: 'moussantji',
      repo: 'Arena',
      releaseType: 'release',
    },
  ],
  extraResources: [
    {
      from: '../../app/dist',
      to: 'app',
      filter: ['**/*'],
    },
    {
      from: '../../api',
      to: 'api',
      filter: apiFilter,
    },
  ],
  linux: {
    target: [
      { target: 'AppImage', arch: ['x64'] },
      { target: 'deb', arch: ['x64'] },
    ],
    category: 'Office',
    executableName: 'kalanso',
    syncDesktopName: true,
    desktop: {
      entry: {
        StartupWMClass: 'kalanso-desktop',
      },
    },
    icon: 'build/icon.png',
    synopsis: 'Gestion scolaire Kalanso',
    description: 'Application desktop de gestion d\'école : élèves, classes, notes, finances, admissions et messagerie.',
    maintainer: 'Kalanso',
  },
  win: {
    target: [
      { target: 'nsis', arch: ['x64'] },
    ],
    icon: 'build/icon.png',
    artifactName: 'Kalanso-Setup-${version}.${ext}',
  },
  nsis: {
    oneClick: false,
    perMachine: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    shortcutName: 'Kalanso',
  },
};
