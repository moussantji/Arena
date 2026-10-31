import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Le renderer est servi tel quel pour la preview sandbox (0.0.0.0 + toutes origines).
// En Electron, le client HMR se connecte au port local de Vite (5179).
// Derrière un proxy HTTPS, définir VITE_HMR_CLIENT_PORT=443.
const hmrClientPort = Number(process.env.VITE_HMR_CLIENT_PORT || 0);

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5179,
    strictPort: true,
    allowedHosts: true,
    cors: true,
    hmr: hmrClientPort ? { clientPort: hmrClientPort } : undefined,
  },
  preview: {
    host: '0.0.0.0',
    port: 5179,
    allowedHosts: true,
  },
  base: './',
});
