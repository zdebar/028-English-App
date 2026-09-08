import { defineConfig } from 'vitest/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

const base = process.env.VITE_BASE_PATH || '/';

// https://vite.dev/config/
export default defineConfig({
  base: base,
  plugins: [
    react({
      babel: {
        plugins: ['babel-plugin-react-compiler'],
      },
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    modulePreload: {
      // HTML preload hints can conflict with service-worker cached module responses in Chrome.
      resolveDependencies: (_filename, dependencies, { hostType }) => {
        if (hostType === 'html') return [];
        return dependencies;
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replaceAll('\\', '/');

          if (!normalizedId.includes('/node_modules/')) {
            return;
          }

          if (
            normalizedId.includes('/node_modules/react/') ||
            normalizedId.includes('/node_modules/react-dom/') ||
            normalizedId.includes('/node_modules/react-router/') ||
            normalizedId.includes('/node_modules/react-router-dom/') ||
            normalizedId.includes('/node_modules/scheduler/')
          ) {
            return 'router-vendor';
          }

          if (normalizedId.includes('/node_modules/@supabase/')) {
            return 'supabase-vendor';
          }

          if (normalizedId.includes('/node_modules/@sentry/')) {
            return 'sentry-vendor';
          }

          if (normalizedId.includes('/node_modules/dexie/')) {
            return 'dexie-vendor';
          }
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
  server: {
    host: true,
    allowedHosts: ['test.mydomain.com'],
  },
});
