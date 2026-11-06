import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5180,
    strictPort: true,
    allowedHosts: true,
    cors: true,
    // Évite le pré-bundling d'une dépendance au champ « browser » fragile.
    optimizeDeps: { include: ['react', 'react-dom', 'react-dom/client', 'react-router-dom', 'lucide-react'] },
  },
  preview: { host: '0.0.0.0', port: 5180, allowedHosts: true },
});
