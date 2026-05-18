import { defineConfig } from 'vitest/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// https://vite.dev/config/
export default defineConfig({
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
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return;
          }

          if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('scheduler')) {
            return 'vendor-react';
          }

          if (id.includes('/react-router-dom/') || id.includes('/react-router/')) {
            return 'vendor-router';
          }

          if (id.includes('/@supabase/')) {
            return 'vendor-supabase';
          }

          if (id.includes('/dexie') || id.includes('/dexie-react-hooks/')) {
            return 'vendor-dexie';
          }

          return 'vendor-misc';
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
});
