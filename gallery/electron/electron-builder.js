// Kalanso — configuration electron-builder
//
// L'application de bureau est un **client** du serveur de l'établissement
// (https://kalanso.mandenbaoubab.com par défaut) : aucun serveur Laravel
// n'est embarqué ni démarré sur le poste. Le paquet contient uniquement
// l'interface React et la coquille Electron, exactement comme l'application
// mobile. Le serveur est l'unique source de vérité des données.

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
