# English Learning App

A Czech-English practice application with local-first progress tracking and Supabase synchronization.

## Repository

- **frontend/** — React, TypeScript, Vite application.
- **supabase/** — Supabase CLI configuration, declarative schemas, migrations, and seed SQL.
- **scripts/** — vocabulary, pronunciation, and audio preparation tools.
- **data/** — lesson source files, audio assets, and archived/imported data.

For the current behavior and ownership boundaries, start with [docs/README.md](docs/README.md).

## Tech stack

- React 19, TypeScript 5, Vite 7, React Router 7
- Tailwind CSS 4, Zustand, Dexie / IndexedDB
- Supabase Auth, PostgreSQL, and Storage
- Vitest, Testing Library, jsdom
- Workbox-based service-worker generation

## Run the frontend

From **frontend/**:

- Install dependencies: **npm install**
- Development server: **npm run dev**
- Production build: **npm run build**
- Build service worker only: **npm run build:sw**
- Preview production build: **npm run preview**
- Lint: **npm run lint**
- Tests: **npm test** or **npm run test:ui**

The production build runs TypeScript, Vite, and service-worker generation through **frontend/scripts/build.mjs**.

## Application structure

- **frontend/src/main.tsx** starts auth and PWA lifecycles and mounts the router.
- **frontend/src/router.tsx** declares routes and connects them to route loaders.
- **frontend/src/routing/** owns route-level data preparation and close navigation.
- **frontend/src/database/models/** defines the Dexie database and table models.
- **frontend/src/database/state/** owns the central in-memory data manager, selectors, and page-package builders.
- **frontend/src/database/practice/** contains practice-selection rules.
- **frontend/src/database/sync/** coordinates incremental data sync.
- **frontend/src/features/** owns feature UI and interaction behavior.
- **frontend/src/components/** contains shared UI and layout components.

### Data flow

IndexedDB is the durable local source for curriculum and user progress. The central data manager loads the active user's local snapshot and builds typed packages for pages. Route loaders ensure a package is ready before navigation; page hooks subscribe to its updates. Successful local writes and sync batches publish committed row changes to the manager. Changes from other tabs arrive through BroadcastChannel.

Audio blobs remain in the separate audio-record cache. The manager does not hold IndexedDB sync metadata or audio blobs.

### Routes

The application uses a hash router. Public routes are **/**, **/privacy-policy**, and **/guide**. Protected routes cover practice, initial training, profile, overviews, topics, grammar, vocabulary, sounds, and pronunciation. See **frontend/src/config/routes.config.ts** and **frontend/src/router.tsx** for the exact paths.

## Synchronization

Data synchronization uses per-table timestamps and is incremental. It does not have a full-sync mode. The singleton sync manager owns periodic work, retryable task failures, online recovery, and audio-archive synchronization. IndexedDB remains available for local reads when the network is unavailable.

The current Supabase model has shared curriculum tables (**levels**, **lessons**, **items**, **notes**), unified content tables (**groups**, **group_items**, **group_relations**), and user tables (**users**, **user_lessons**, **user_items**). User accounts and their user-owned records are hard-deleted; **deleted_at** is used for shared-content tombstones.

## Supabase files

The active schema and seed order is configured in **supabase/config.toml**. Declarative schemas live in **supabase/schemas/**; migrations live in **supabase/migrations/**; reset seed SQL lives in **supabase/seeds/**.

Useful entrypoints include:

- **supabase/schemas/00_tables.sql** — current tables, constraints, and indexes
- **supabase/schemas/10_updated_at_triggers.sql** — timestamp triggers and group-relation validation
- **supabase/schemas/20_auth_helpers.sql** and **21_json_key_helpers.sql** — shared RPC helpers
- **supabase/schemas/30_rpc_fetch_user_items.sql** — incremental user-item fetch
- **supabase/schemas/31_rpc_upsert_user_items.sql** — user-item upload RPC
- **supabase/schemas/32_rpc_upsert_fetch_user_items.sql** — combined user-item sync RPC
- **supabase/schemas/41_anonymous_cleanup_function.sql** and **42_cron_jobs.sql** — anonymous-account cleanup
- **supabase/schemas/50_storage_buckets.sql** — private audio buckets and policies
- **supabase/schemas/40_user_lifecycle_functions.sql** — authenticated hard-delete function
- **supabase/schemas/90_rls.sql** — row-level security and grants

## Routes

The hash router exposes these paths:

- Public: **/**, **/privacy-policy**, **/guide**
- Practice: **/practice**, **/practice/grammar**, **/practice/vocabulary**, **/practice/initial-training**
- Account: **/profile**
- Overviews: **/overviews**, **/topics**, **/topics/:topicId**, **/grammar**, **/vocabulary**, **/sounds**, **/sounds/:groupId**, **/pronunciation**, **/pronunciation/:groupId**

The route constants are maintained in **frontend/src/config/routes.config.ts**.

## Local environment

Create **frontend/.env.local** with **VITE_SUPABASE_URL** and **VITE_SUPABASE_PUBLISHABLE_KEY** for the Supabase project. Local Supabase settings are in **supabase/config.toml**. Manual account linking is enabled locally; hosted projects must enable **Allow manual linking** in Supabase Authentication settings for guest-account conversion.

## PWA assets

Static assets live in **frontend/public/**, including **manifest.json**, **service-worker.js**, **robots.txt**, and **sitemap.xml**. The build injects the production asset list into the service worker; development removes only registrations and caches belonging to this app's configured base path.

## Tests and conventions

Frontend tests are colocated under **tests/** folders and use Vitest, Testing Library, and jsdom. Run **npm test** from **frontend/** for the test suite. Run **npm run lint** for ESLint.

Components and pages use PascalCase filenames; hooks and utilities use kebab-case where practical; SQL names use snake_case. Follow [STYLEGUIDE.md](STYLEGUIDE.md) for code and review conventions.

## PWA

PWA startup is owned by **frontend/src/features/pwa/pwa-lifecycle.ts**. It requests persistent storage when supported, records install events, registers the service worker in production, and removes app-scoped worker registrations and caches in development. **frontend/scripts/generate-sw.mjs** adds the built asset list to the worker.

## Content preparation

See [scripts/README.md](scripts/README.md) for the CSV, IPA, and audio preparation scripts. Those scripts prepare files; Supabase seed SQL and schema setup are maintained separately.

## Related guides

- [STYLEGUIDE.md](STYLEGUIDE.md) — code and review conventions
- [DATA_GUIDE.md](DATA_GUIDE.md) — current data model and content boundaries
- [frontend/VITE.md](frontend/VITE.md) — project-specific Vite configuration
