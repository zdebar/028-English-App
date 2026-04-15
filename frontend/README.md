# Frontend Documentation

Frontend for the English Learning App.

This application is built as an offline-first practice client:

- learning progress is stored locally in IndexedDB
- synchronization keeps local and Supabase data aligned
- UI is optimized for drill-based repetition workflows

## Stack

- React 19 + TypeScript
- Vite 7
- Tailwind CSS
- Zustand (client state)
- Dexie (IndexedDB)
- Supabase JS client
- Vitest + Testing Library

## Directory Layout

`src/` high-level structure:

- `components/`: reusable UI and app utility components
- `features/`: domain modules (auth, practice, vocabulary, theme, help, sync, etc.)
- `database/`: Dexie models, synchronization utilities, database hooks
- `hooks/`: shared hooks
- `pages/`: route/page composition
- `types/`: application types
- `utils/`: cross-domain helpers
- `workers/`: worker-oriented logic

## Scripts

Run commands from `frontend/`:

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm test
npm run test:ui
```

`npm run build` also executes service worker manifest injection via:

- `scripts/generate-sw.mjs`

## Environment

Use `frontend/.env.local` for local configuration.

Typical required values:

- Supabase URL
- Supabase anon key

## Data Model (Conceptual)

Main entities:

- `levels`
- `lessons`
- `items`
- `grammar`
- `user_items`
- `user_scores`

Important synchronization timestamps/flags:

- `updated_at`
- `started_at`
- `next_at`
- `mastered_at`
- `deleted_at`

## Offline and Sync Strategy

1. Update local IndexedDB first for fast UI response.
2. Push local changes to remote backend.
3. Pull remote updates (delta or full sync).
4. Keep user-visible state driven by local stores.

## PWA

- Service worker source: `public/service-worker.js`
- Web manifest: `public/manifest.json`
- Precache list is injected at build time using Workbox.

## Testing

Test files live close to feature/domain folders:

- `src/**/tests/*.test.ts`
- `src/**/tests/*.test.tsx`

Recommended workflow:

```bash
npm test
npm run lint
```

## Conventions

- File naming: kebab-case for files where practical
- React components: PascalCase
- Hooks: `useXxx`
- SQL/database names: snake_case

## Roadmap Snapshot

- stronger retry/error handling around network services
- deeper accessibility improvements
- synchronization and performance tuning
- multilingual content expansion

## Related Docs

- project overview: `../README.md`
- planning notes: `TODO.md`
- default Vite template reference: `VITE.md`
