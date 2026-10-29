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

The current app wiring in [frontend/src/router.tsx](frontend/src/router.tsx) includes:

- Public routes: `/`, `/privacy-policy`, and `/guide`
- Protected practice routes: `/practice`, `/practice/grammar`, `/practice/vocabulary`,
  and `/practice/initial-training`
- Protected overview routes: `/overviews`, `/topics`, `/topics/:topicId`, `/grammar`,
  `/vocabulary`, `/sounds`, `/sounds/:groupId`, `/pronunciation`, and
  `/pronunciation/:groupId`
- Protected account route: `/profile`

Unknown routes render a page-not-found notification.

## Feature Summary

The frontend initializes app-wide flows in [frontend/src/App.tsx](frontend/src/App.tsx)
and keeps user progress local-first through IndexedDB. The main feature areas are:

- Supabase authentication with anonymous sign-in, Google sign-in, account
  conversion, sign-out, and hard-delete support.
- Vocabulary and grammar review plus initial training, with local progress saves,
  audio playback, and sync-backed recovery.
- Home readiness buttons and a non-clickable progress dashboard, plus overview
  pages for sounds, pronunciation, grammar, topics, and vocabulary.
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
Declarative database objects live in [supabase/schemas](supabase/schemas),
incremental migrations live in [supabase/migrations](supabase/migrations), and
database-reset seed SQL lives in [supabase/seeds](supabase/seeds). The active
schema and seed file order is configured in [supabase/config.toml](supabase/config.toml).

Important files include:

- [supabase/schemas/00_tables.sql](supabase/schemas/00_tables.sql): core tables and indexes
- [supabase/schemas/10_updated_at_triggers.sql](supabase/schemas/10_updated_at_triggers.sql): trigger wiring such as `updated_at`
- [supabase/schemas/20_auth_helpers.sql](supabase/schemas/20_auth_helpers.sql): shared RPC auth helpers
- [supabase/schemas/30_rpc_fetch_user_items.sql](supabase/schemas/30_rpc_fetch_user_items.sql): user item fetch RPC
- [supabase/schemas/31_rpc_upsert_user_items.sql](supabase/schemas/31_rpc_upsert_user_items.sql): user item upsert RPC
- [supabase/schemas/32_rpc_upsert_fetch_user_items.sql](supabase/schemas/32_rpc_upsert_fetch_user_items.sql): combined user item sync RPC
- [supabase/schemas/40_user_lifecycle_functions.sql](supabase/schemas/40_user_lifecycle_functions.sql): authenticated user hard-delete function
- [supabase/schemas/41_anonymous_cleanup_function.sql](supabase/schemas/41_anonymous_cleanup_function.sql): cleanup function for old anonymous accounts
- [supabase/schemas/42_cron_jobs.sql](supabase/schemas/42_cron_jobs.sql): scheduled database jobs
- [supabase/schemas/50_storage_buckets.sql](supabase/schemas/50_storage_buckets.sql): audio storage buckets and access policy
- [supabase/schemas/90_rls.sql](supabase/schemas/90_rls.sql): row-level security policies and table grants
- [supabase/seeds/remote_data.sql](supabase/seeds/remote_data.sql): shared lesson and item data loaded on database reset
- [supabase/seeds/01_legacy_group_import.sql](supabase/seeds/01_legacy_group_import.sql), [supabase/seeds/02_unified_groups.sql](supabase/seeds/02_unified_groups.sql), and [supabase/seeds/03_cleanup_legacy_group_import.sql](supabase/seeds/03_cleanup_legacy_group_import.sql): import legacy group data into the unified group model

Current application-owned database tables:

- Shared curriculum and content in `public`: `levels`, `lessons`, `items`, and `notes`
- Unified content groups in `public`: `groups`, `group_items`, and `group_relations`.
  Groups use the `topic`, `grammar`, `sound`, or `pronunciation` type; relations
  represent hierarchy, detail, or contrast.
- User records in `public`: `users`, `user_lessons`, and `user_items`
- Operational settings in `private`: `private.settings`

The main content model links ordered `items` to `lessons`. `groups` organize topics,
grammar content, sounds, and pronunciation content independently of the lesson
curriculum; `group_items` links groups to items.

Important sync and progress fields include:

- `updated_at`
- `deleted_at` for soft-deleted shared content
- `started_at` for user lesson and item progress
- `progress_cz_to_en` and `progress_en_to_cz` for directional progress
- `next_at_cz_to_en` and `next_at_en_to_cz` for directional review scheduling
- `mastered_at_cz_to_en` and `mastered_at_en_to_cz` for directional mastery

## PWA and Static Assets

Frontend static assets live in [frontend/public](frontend/public).

Included assets:

- [frontend/public/manifest.json](frontend/public/manifest.json)
- [frontend/public/service-worker.js](frontend/public/service-worker.js)
- [frontend/public/robots.txt](frontend/public/robots.txt)
- [frontend/public/sitemap.xml](frontend/public/sitemap.xml)

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
