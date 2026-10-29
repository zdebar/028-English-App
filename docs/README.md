# Behavior Documentation

These documents explain how the current frontend connects routes, IndexedDB,
Supabase synchronization, state stores, and feature modules. They describe runtime
behavior and point to the code that owns it.

## Map

| Topic | Start here |
| --- | --- |
| Feature ownership and user-visible behavior | [features.md](features.md) |
| Startup, routes, and application boundaries | [frontend-architecture.md](frontend-architecture.md) |
| Zustand stores and reactive IndexedDB queries | [state-and-events.md](state-and-events.md) |
| Local data, Supabase sync, and browser storage | [data-and-sync.md](data-and-sync.md) |
| Review and initial-training behavior | [practice-flows.md](practice-flows.md) |
| Home practice availability and limits | [home-readiness.md](home-readiness.md) |
| Current database entities, fields, and Dexie indexes | [domain-models.md](domain-models.md) |
| eSpeak NG IPA output for US English | [espeak-ipa-en-us.md](espeak-ipa-en-us.md) |

## Where To Look First

| Task | Primary doc | Main code entrypoint |
| --- | --- | --- |
| Understand startup and routes | [frontend-architecture.md](frontend-architecture.md) | `frontend/src/main.tsx`, `frontend/src/App.tsx`, `frontend/src/router.tsx` |
| Find feature ownership | [features.md](features.md) | `frontend/src/features` |
| Debug authentication or account actions | [features.md](features.md) | `frontend/src/features/auth` |
| Change Home practice availability | [home-readiness.md](home-readiness.md) | `frontend/src/features/practice/PracticeButton.tsx` |
| Change review or initial training | [practice-flows.md](practice-flows.md) | `frontend/src/features/practice` |
| Debug synchronization | [data-and-sync.md](data-and-sync.md) | `frontend/src/database/utils/data-sync.utils.ts` |
| Change database entities or query indexes | [domain-models.md](domain-models.md) | `frontend/src/database/models/app-db.ts` |
| Debug reactive query refresh | [state-and-events.md](state-and-events.md) | `frontend/src/hooks/shared-query-store.ts` |
| Change overview pages | [features.md](features.md) | `frontend/src/features/{topics,grammar,vocabulary,sounds,pronunciation}` |
| Change audio behavior | [features.md](features.md) | `frontend/src/features/audio` |
| Change theme, PWA, toast, help, or overlay behavior | [features.md](features.md) | `frontend/src/features/{theme,pwa,toast,help,overlay}` |
| Check how IPA is generated | [espeak-ipa-en-us.md](espeak-ipa-en-us.md) | `scripts/utils/pronunciation.py` |

## Maintenance

When a change affects a behavior documented here, update the matching page in the
same change. Keep database table names aligned with `supabase/schemas/00_tables.sql`
and the active Dexie tables in `frontend/src/database/models/app-db.ts`.
