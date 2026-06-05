/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  // En production (GitHub Pages), le site est servi depuis /script-finance/.
  // En développement local, on reste à la racine.
  base: command === 'build' ? '/script-finance/' : '/',
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
}));
