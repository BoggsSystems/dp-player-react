import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/player/',
  plugins: [react()],
  server: {
    port: 4201,
    host: true,
    cors: true,
    // @ts-expect-error vite 5/6 allowedHosts support
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:9000',
        changeOrigin: true,
      },
    },
  },
});
