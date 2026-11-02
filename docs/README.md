# Frontend behavior documentation

These guides describe the current frontend boundaries and point to the code that owns each behavior.

## Guides

| Topic | Guide |
| --- | --- |
| Feature ownership and visible behavior | [features.md](features.md) |
| Startup, routes, and application boundaries | [frontend-architecture.md](frontend-architecture.md) |
| Central data manager and UI state | [state-and-events.md](state-and-events.md) |
| IndexedDB, Supabase sync, and retries | [data-and-sync.md](data-and-sync.md) |
| Review and initial-training behavior | [practice-flows.md](practice-flows.md) |
| Home practice availability | [home-readiness.md](home-readiness.md) |
| Database entities and Dexie indexes | [domain-models.md](domain-models.md) |
| eSpeak NG IPA output for US English | [espeak-ipa-en-us.md](espeak-ipa-en-us.md) |

## Start by task

| Task | Main code entrypoint |
| --- | --- |
| Startup and routes | **frontend/src/main.tsx**, **frontend/src/App.tsx**, **frontend/src/router.tsx** |
| Route data packages | **frontend/src/routing/route-loaders.ts**, **frontend/src/routing/route-data.ts** |
| Data manager, selectors, and builders | **frontend/src/database/state/** |
| Authentication | **frontend/src/features/auth/** |
| Sync orchestration and retry | **frontend/src/features/synchronization/sync-manager.ts** |
| IndexedDB models | **frontend/src/database/models/** |
| Practice behavior | **frontend/src/features/practice/** |
| Audio playback and archive cache | **frontend/src/features/audio/** and **frontend/src/database/audio/** |
| Overview pages | **frontend/src/features/overviews/**, **topics/**, **grammar/**, **vocabulary/**, **sounds/**, **pronunciation/** |

## Maintenance

When a change affects documented behavior, update the matching guide in the same change. Keep table and index descriptions aligned with **supabase/schemas/00_tables.sql** and **frontend/src/database/models/app-db.ts**.
