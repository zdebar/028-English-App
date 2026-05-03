# English Learning App

English Learning App is a Czech-English practice application built around local-first progress tracking and Supabase-backed synchronization.

The main product is the web frontend in [frontend](frontend), supported by backend SQL assets, edge-function code, and source lesson/audio data in this repository.

## Repository Overview

Main folders:

- [frontend](frontend): React + TypeScript + Vite application
- [backend/database](backend/database): PostgreSQL schema, triggers, and RPC SQL for Supabase
- [backend/functions](backend/functions): edge function sources
- [backend/shared](backend/shared): shared backend helpers
- [scripts](scripts): preparation and utility scripts

## What The Frontend Does

The current frontend provides:

- authentication and session initialization
- guided practice flow for vocabulary and grammar
- overview screens for levels, blocks, grammar, and vocabulary
- local user progress storage through IndexedDB
- periodic synchronization with remote data sources
- theme, toast, overlay, and help-state management through feature stores

## Tech Stack

- Frontend: React 19, TypeScript 5, Vite 7, React Router 7
- Styling: Tailwind CSS 4
- State: Zustand
- Local persistence: Dexie + IndexedDB
- Backend platform: Supabase Auth, PostgreSQL, Storage, Edge Functions
- Testing: Vitest, Testing Library, jsdom
- Build tooling: Workbox-based service worker generation

## Quick Start

### Prerequisites

- Node.js 20+
- npm 10+
- Supabase project configuration for the frontend

### Install

```bash
cd frontend
npm install
```

### Run Development Server

```bash
cd frontend
npm run dev
```

### Build Production

```bash
cd frontend
npm run build
```

This runs the TypeScript build, the Vite production build, and service worker generation through [frontend/scripts/generate-sw.mjs](frontend/scripts/generate-sw.mjs).

### Preview Production Build

```bash
cd frontend
npm run preview
```

## Frontend Scripts

Run these from [frontend](frontend):

```bash
npm run dev
npm run build
npm run build:sw
npm run preview
npm run lint
npm test
npm run test:ui
```

Script notes:

- `npm run dev`: start Vite dev server
- `npm run build`: compile TypeScript, build app, generate service worker assets
- `npm run build:sw`: run [frontend/scripts/generate-sw.mjs](frontend/scripts/generate-sw.mjs)
- `npm run preview`: preview the production build
- `npm test`: run Vitest in CLI mode
- `npm run test:ui`: open Vitest UI

## Frontend Application Structure

Top-level folders in [frontend/src](frontend/src):

- [frontend/src/components](frontend/src/components): shared UI, layout, and utility components
- [frontend/src/config](frontend/src/config): routes and app configuration
- [frontend/src/database](frontend/src/database): Dexie models, sync helpers, and DB hooks
- [frontend/src/features](frontend/src/features): auth, practice, sync, toast, theme, help, overlay, vocabulary, and more
- [frontend/src/hooks](frontend/src/hooks): generic reusable hooks
- [frontend/src/locales](frontend/src/locales): UI text and localization data
- [frontend/src/pages](frontend/src/pages): route-level pages
- [frontend/src/styles](frontend/src/styles): global styling entrypoints
- [frontend/src/types](frontend/src/types): shared types
- [frontend/src/utils](frontend/src/utils): helper functions
- [frontend/src/workers](frontend/src/workers): worker-oriented logic

## Main Frontend Routes

The current app wiring in [frontend/src/App.tsx](frontend/src/App.tsx) includes:

- `/`: home page
- `/privacy-policy`: privacy policy page
- `/guide`: guide page
- protected routes for practice, profile, levels, blocks, block detail, grammar, and vocabulary

Unknown routes render a page-not-found notification.

## Runtime Behavior

The frontend currently initializes several app-wide flows in [frontend/src/App.tsx](frontend/src/App.tsx):

- auth bootstrapping through the auth store
- theme loading per user
- periodic synchronization
- daily stats reset
- global toast and overlay rendering

Loading state is driven by combined auth and sync activity.

## Offline and Sync Architecture

The app is designed around local-first reads with synchronization support.

Typical flow:

1. User actions update local IndexedDB state first.
2. Synchronization pushes local changes to Supabase.
3. Synchronization pulls remote deltas or full data.
4. UI reads from local models, hooks, and stores for responsiveness.

Key frontend areas:

- [frontend/src/database](frontend/src/database)
- [frontend/src/features/sync](frontend/src/features/sync)
- [frontend/src/features/auth](frontend/src/features/auth)
- [frontend/src/features/user-stats](frontend/src/features/user-stats)

## Database and Backend Assets

The SQL files in [backend/database](backend/database) are intended for Supabase SQL editor or migration usage.

Important files include:

- [backend/database/postgresql-tables.sql](backend/database/postgresql-tables.sql): core tables and indexes
- [backend/database/postgresql-triggers.sql](backend/database/postgresql-triggers.sql): trigger wiring such as `updated_at`
- [backend/database/RPC_fetch_user_items.sql](backend/database/RPC_fetch_user_items.sql): user item fetch RPC
- [backend/database/RPC_upsert_user_items.sql](backend/database/RPC_upsert_user_items.sql): user item sync write RPC
- [backend/database/RPC_upsert_user_scores.sql](backend/database/RPC_upsert_user_scores.sql): user score sync write RPC
- [backend/database/RPC_upsert_fetch_user_items.sql](backend/database/RPC_upsert_fetch_user_items.sql): combined upsert + fetch RPC
- [backend/database/RPC_upsert_fetch_user_scores.sql](backend/database/RPC_upsert_fetch_user_scores.sql): combined upsert + fetch RPC

Main domain tables/entities across the project:

- `levels`, `lessons`, `items`, `grammar`
- `user_items`, `user_scores`
- sync metadata and user-linked records

Important sync fields include:

- `updated_at`
- `started_at`
- `next_at`
- `mastered_at`
- `deleted_at`

## PWA and Static Assets

Frontend static assets live in [frontend/public](frontend/public).

Included assets:

- [frontend/public/manifest.json](frontend/public/manifest.json)
- [frontend/public/service-worker.js](frontend/public/service-worker.js)
- [frontend/public/robots.txt](frontend/public/robots.txt)
- [frontend/public/sitemap.xml](frontend/public/sitemap.xml)

Important current note:

- service worker registration code in [frontend/src/main.tsx](frontend/src/main.tsx) is currently commented out
- build-time service worker generation still runs through [frontend/scripts/generate-sw.mjs](frontend/scripts/generate-sw.mjs)

## Styling and Build Configuration

Relevant frontend files:

- [frontend/vite.config.ts](frontend/vite.config.ts)
- [frontend/tailwind.config.ts](frontend/tailwind.config.ts)
- [frontend/src/styles/index.css](frontend/src/styles/index.css)
- [frontend/src/App.css](frontend/src/App.css)

Current build configuration includes:

- `@vitejs/plugin-react`
- `babel-plugin-react-compiler`
- `@tailwindcss/vite`
- `@` path alias to `frontend/src`
- Vitest with `jsdom` and globals enabled

## Testing and Quality

Most frontend tests live close to the relevant domain code under `tests` folders.

Typical patterns:

- `frontend/src/**/tests/*.test.ts`
- `frontend/src/**/tests/*.test.tsx`

Recommended workflow:

```bash
cd frontend
npm test
npm run lint
```

## Environment Setup

Frontend environment values should be placed in [frontend/.env.local](frontend/.env.local) when running locally.

Typical values include:

- Supabase project URL
- Supabase anonymous key

## Data and Content Assets

The [data](data) folder contains lesson source files, generated datasets, metadata, and audio assets used by the application and preparation scripts.

The [scripts](scripts) and [data/scripts](data/scripts) areas support content preparation and transformation workflows.

## Conventions

- React components use PascalCase
- hooks follow the `useXxx` pattern
- SQL and table names use snake_case
- file naming is kebab-case where practical

## Related Documentation

- frontend Vite reference: [frontend/VITE.md](frontend/VITE.md)
- frontend task notes: [frontend/TODO.md](frontend/TODO.md)
