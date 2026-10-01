import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// During development the React app runs on Vite's dev server (5173) while the
// Express + MongoDB backend runs separately (default 5000). Proxy /api so the
// same fetch('/api/...') calls work in dev and in production (where Express
// serves the built client and the API from the same origin).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
