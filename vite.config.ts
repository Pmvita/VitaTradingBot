import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@gui': path.resolve(__dirname, './src/gui'),
      '@bot': path.resolve(__dirname, './src/bot'),
      '@wallet': path.resolve(__dirname, './src/wallet'),
      '@api': path.resolve(__dirname, './src/api'),
      '@storage': path.resolve(__dirname, './src/storage'),
      '@utils': path.resolve(__dirname, './src/utils'),
    },
  },
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
  },
});

