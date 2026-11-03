# Vite configuration

The frontend uses the Vite configuration in **vite.config.ts**. This file describes project-specific settings; for install and run commands, see the repository [README](../README.md).

## Plugins and compiler

- **@vitejs/plugin-react** provides React integration and Fast Refresh.
- **babel-plugin-react-compiler** is enabled through the React plugin.
- **@tailwindcss/vite** processes Tailwind CSS 4.

The React Compiler is enabled; the default Vite template instructions about enabling it do not apply here.

## Aliases and base path

The **@** import alias points to **frontend/src**. Set **VITE_BASE_PATH** to change Vite's public base path; it defaults to **/**. The base path is also used to scope PWA service-worker registration and caches.

## Build behavior

The build defines separate vendor chunks for React/router, Supabase, and Dexie. HTML module-preload hints are disabled to avoid conflicts with service-worker cached module responses in Chrome.

The project build wrapper runs the TypeScript build, Vite production build, then service-worker generation. Vitest is configured here with the jsdom environment and globals.
