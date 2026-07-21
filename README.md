# English Learning App

English Learning App is a Czech-English practice application built around local-first progress tracking and Supabase-backed synchronization.

The main product is the web frontend in [frontend](frontend), supported by backend SQL assets, and source lesson/audio data in this repository.

## Repository Overview

Main folders:

- [frontend](frontend): React + TypeScript + Vite application
- [supabase](supabase): Supabase CLI config, declarative schemas, seeds, and archived dumps
- [scripts](scripts): preparation and utility scripts

Repository docs:

- [STYLEGUIDE.md](STYLEGUIDE.md): recommended repository coding style and review defaults
- [docs/README.md](docs/README.md): frontend behavior docs for architecture, state, sync, practice flows, readiness counts, and domain models

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
- [frontend/src/features](frontend/src/features): auth, practice, synchronization, toast, theme, help, overlay, vocabulary, and more
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

## Feature Summary

The frontend initializes app-wide flows in [frontend/src/App.tsx](frontend/src/App.tsx)
and keeps user progress local-first through IndexedDB. The main feature areas are:

- Supabase authentication with anonymous sign-in, Google sign-in, account
  conversion, sign-out, and soft-delete/reactivation support.
- Unified vocabulary/grammar review and inline new-grammar learning with local
  progress saves, audio playback, daily score updates, and sync-backed recovery.
- Home readiness buttons, dashboard stats, practice overview, and overview pages
  for levels, blocks, grammar, and vocabulary.
- Periodic, logout, and unmount synchronization for user progress and shared
  content, plus audio archive synchronization.
- Global UI infrastructure for theme, toast, help, overlay, PWA install prompt,
  privacy policy, guide, logging, and analytics.

For developer-oriented ownership, data flow, persistence, and side-effect details,
start with [docs/features.md](docs/features.md).

## Offline and Sync Architecture

The app is designed around local-first reads with synchronization support.

Typical flow:

1. User actions update local IndexedDB state first.
2. Synchronization pushes local changes to Supabase.
3. Synchronization pulls remote deltas or full data.
4. UI reads from local models, hooks, and stores for responsiveness.

Key frontend areas:

- [frontend/src/database](frontend/src/database)
- [frontend/src/features/synchronization](frontend/src/features/synchronization)
- [frontend/src/features/auth](frontend/src/features/auth)
- [frontend/src/features/user-stats](frontend/src/features/user-stats)

## Database and Backend Assets

Supabase SQL is managed through the CLI layout in [supabase](supabase).
Declarative database objects live in [supabase/schemas](supabase/schemas), and reset-time seed/operational SQL lives in [supabase/seeds](supabase/seeds).

Important files include:

- [supabase/schemas/00_public_tables.sql](supabase/schemas/00_public_tables.sql): core tables and indexes
- [supabase/schemas/10_updated_at_triggers.sql](supabase/schemas/10_updated_at_triggers.sql): trigger wiring such as `updated_at`
- [supabase/schemas/20_auth_helpers.sql](supabase/schemas/20_auth_helpers.sql): shared RPC auth helpers
- [supabase/schemas/30_rpc_fetch_user_items.sql](supabase/schemas/30_rpc_fetch_user_items.sql): user item fetch RPC
- [supabase/schemas/35_rpc_fetch_user_blocks.sql](supabase/schemas/35_rpc_fetch_user_blocks.sql): user block fetch RPC
- [supabase/schemas/40_user_lifecycle_functions.sql](supabase/schemas/40_user_lifecycle_functions.sql): user soft-delete/reactivation functions
- [supabase/schemas/90_rls.sql](supabase/schemas/90_rls.sql): RLS policies and table grants
- [supabase/seeds/00_private_settings.sql](supabase/seeds/00_private_settings.sql): private settings seed values
- [supabase/seeds/01_cron_schedules.sql](supabase/seeds/01_cron_schedules.sql): local reset cron scheduling SQL

Main domain tables/entities across the project:

- `levels`, `lessons`, `items`, `grammar_groups`, `grammar_chunks`, `blocks`, `notes`
- `user_items`, `user_scores`, `user_blocks`
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

Google guest-account conversion also requires manual identity linking in both
environments. Local development enables `auth.enable_manual_linking` in
`supabase/config.toml`; hosted projects must separately enable **Allow manual
linking** in Supabase Dashboard under Authentication configuration.

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
- frontend behavior docs: [docs/README.md](docs/README.md)
