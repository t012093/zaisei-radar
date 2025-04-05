import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: true,
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'recharts'],
          utils: ['/src/utils/dataProcessing.ts'],
        },
      },
    },
  },
  server: {
    headers: {
      'Content-Type': 'application/javascript',
    },
  },
});
