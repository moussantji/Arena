// Pont sécurisé entre Electron et le renderer.
// Le renderer ne voit que cette petite API — aucun accès Node.
const { contextBridge, ipcRenderer } = require('electron');

// Adresse effective de l'API (distante ou locale), fournie par le process
// principal au démarrage. sendSync : un seul appel, valeur minuscule.
const apiUrl = ipcRenderer.sendSync('api:url');

contextBridge.exposeInMainWorld('desktopAPI', {
  platform: process.platform,
  apiUrl,
  apiInfo: () => ipcRenderer.invoke('api:info'),
  setApiUrl: (url) => ipcRenderer.invoke('api:setUrl', url),
  minimize: () => ipcRenderer.send('window:minimize'),
  toggleMaximize: () => ipcRenderer.send('window:toggleMaximize'),
  close: () => ipcRenderer.send('window:close'),
  onState: (cb) => {
    const handler = (_e, state) => cb(state);
    ipcRenderer.on('window:state', handler);
    return () => ipcRenderer.removeListener('window:state', handler);
  },
  googleSignIn: () => ipcRenderer.invoke('google:signIn'),
  googleCancel: () => ipcRenderer.invoke('google:cancel'),
  updates: {
    version: () => ipcRenderer.invoke('update:version'),
    check: () => ipcRenderer.invoke('update:check'),
    download: () => ipcRenderer.invoke('update:download'),
    install: () => ipcRenderer.invoke('update:install'),
    onStatus: (cb) => {
      const handler = (_event, status) => cb(status);
      ipcRenderer.on('update:status', handler);
      return () => ipcRenderer.removeListener('update:status', handler);
    },
  },
});
