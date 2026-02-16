import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

import { apiMiddleware } from './server/api-middleware.js';

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'ncodes-api',
      configureServer: apiMiddleware,
    },
  ],
  server: {
    port: 3000
  }
});
