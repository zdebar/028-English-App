# English Learning App

English Learning App is an offline-first drill application for Czech-English practice.
The frontend stores learning state in IndexedDB and synchronizes with Supabase.

## What This Repository Contains

- `frontend/`: React + TypeScript + Vite web app (main product)
- `backend/database/`: PostgreSQL schema, triggers, and RPC SQL for Supabase
- `backend/functions/`: Edge function sources for user deletion workflows
- `backend/shared/`: Shared backend utility modules
- `data/`: lesson source files and audio-related assets/scripts
- `scripts/`: utility scripts for data preparation
- `archive/`: historical SQL helpers and migration snippets

## Tech Stack

- Frontend: React 19, TypeScript, Vite, Tailwind CSS, Zustand
- Local persistence: Dexie + IndexedDB
- Backend platform: Supabase (Auth, PostgreSQL, Storage, Edge Functions)
- Testing: Vitest + Testing Library + jsdom
- PWA tooling: Workbox (`injectManifest`) via build script

## Quick Start

### Prerequisites

- Node.js 20+
- npm 10+
- Supabase project (URL + anon key configured in frontend env)

### Install

```bash
cd frontend
npm install
```

### Run Development Server

```bash
npm run dev
```

### Build Production

```bash
npm run build
```

This build also runs the service worker manifest injection script (`frontend/scripts/generate-sw.mjs`).

### Preview Production Build

```bash
npm run preview
```

## Testing and Quality

From `frontend/`:

```bash
npm test
npm run test:ui
npm run lint
```

## Environment Setup

Create/update frontend env values in `frontend/.env.local`.
Typical values include Supabase project URL and anonymous key used by the client app.

## Database and Backend Assets

The SQL files under `backend/database/` are intended to be applied in Supabase SQL editor or migration flow.

Key files:

- `backend/database/postgresql-tables.sql`: core tables, indexes, auth-user trigger
- `backend/database/postgresql-triggers.sql`: `updated_at` trigger wiring
- `backend/database/RPC_fetch_user_items.sql`: RPC for loading user items
- `backend/database/RPC_upsert_user_items.sql`: RPC for user item sync writes
- `backend/database/RPC_upsert_user_scores.sql`: RPC for user score sync writes

## Architecture Overview

### Offline-First Data Flow

1. User actions update local IndexedDB first.
2. Sync pushes local changes to Supabase.
3. Sync pulls remote deltas (or full data on full sync).
4. UI reads from local stores/hooks for responsive behavior.

### Main Domain Tables

- `levels`, `lessons`, `items`, `grammar`
- `user_items`, `user_scores`
- `users`

### Important Sync Fields

- `updated_at`: delta synchronization anchor
- `started_at`: first activity marker
- `next_at`: scheduling field for practice availability
- `mastered_at`: mastery marker
- `deleted_at`: soft-delete marker

## Frontend Structure Snapshot

Inside `frontend/src/`:

- `features/`: app modules (auth, practice, vocabulary, theme, sync, etc.)
- `database/`: Dexie models, sync utilities, data hooks
- `components/`: reusable UI and utility components
- `hooks/`: reusable hooks
- `pages/`: route-level page composition
- `workers/`: worker-related client logic

## PWA Notes

- Service worker source: `frontend/public/service-worker.js`
- Manifest: `frontend/public/manifest.json`
- Build-time precache injection is performed after Vite build.

## Current Focus Areas (from project TODO)

- Better error resilience and retry behavior
- Database optimization and backup workflow
- Accessibility improvements
- Expanded language/content capabilities

## Contribution Notes

- Use feature-focused commits (`feat`, `fix`, `docs`, `test`, `refactor`, etc.)
- Keep naming conventions consistent:
  - File names: kebab-case where applicable
  - SQL and storage table names: snake_case
  - React components: PascalCase
  - Hooks: `useXxx`

## Additional Documentation

- Frontend deep dive: `frontend/README.md`
- Vite template notes: `frontend/VITE.md`
- Planned work: `frontend/TODO.md`
