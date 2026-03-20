import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@components': path.resolve(__dirname, 'src/components'),
      '@pages': path.resolve(__dirname, 'src/pages'),
      '@context': path.resolve(__dirname, 'src/context'),
      '@hooks': path.resolve(__dirname, 'src/hooks'),
      '@api': path.resolve(__dirname, 'src/api'),
      '@app-types': path.resolve(__dirname, 'src/types'),
    },
  },
  server: {
    port: 5173,
    // Proxy API requests to avoid CORS issues in development
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_URL ?? 'http://localhost:3000',
        changeOrigin: true,
        proxyTimeout: 3_600_000, // 1 hour — large video uploads can take a long time
        timeout: 3_600_000,
      },
    },
  },
});
