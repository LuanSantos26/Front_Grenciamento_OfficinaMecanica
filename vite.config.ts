import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' permite abrir o build (dist/index.html) em qualquer pasta ou servidor
export default defineConfig({
  plugins: [react()],
  base: './',
  server: { port: 5173 },
});
