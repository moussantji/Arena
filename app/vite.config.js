import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Le renderer est servi tel quel pour la preview sandbox (0.0.0.0 + toutes origines).
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5179,
    strictPort: true,
    allowedHosts: true,
    cors: true,
    hmr: { clientPort: 443 },
  },
  preview: {
    host: '0.0.0.0',
    port: 5179,
    allowedHosts: true,
  },
  base: './',
});
