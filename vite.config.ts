import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // Membuka akses jaringan lokal untuk pengujian via perangkat seluler
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Dinonaktifkan pada tahap produksi demi efisiensi ukuran file bundel
    chunkSizeWarningLimit: 1600,
  },
});
