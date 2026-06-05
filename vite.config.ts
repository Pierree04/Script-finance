/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  // Chemins relatifs : le site fonctionne quel que soit le sous-dossier
  // (et quelle que soit la casse de l'URL sur GitHub Pages).
  // Compatible avec HashRouter (navigation via #/...).
  base: './',
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
