# Behavior Documentation

This documentation explains how the frontend pieces connect at runtime: route pages,
IndexedDB models, synchronization, global stores, feature hooks, localStorage, and
cross-feature events.

It is intentionally behavior-focused. Use it to answer questions like "what
recalculates this count?", "where does this state persist?", and "which feature
owns this side effect?".

## Map

| Topic | Start here |
| --- | --- |
| All frontend features and connection points | [features.md](features.md) |
| App boot, routes, state categories | [frontend-architecture.md](frontend-architecture.md) |
| Zustand stores and reactive IndexedDB state | [state-and-events.md](state-and-events.md) |
| IndexedDB, Supabase sync, localStorage fallbacks | [data-and-sync.md](data-and-sync.md) |
| Vocabulary, grammar, and new grammar practice flows | [practice-flows.md](practice-flows.md) |
| Home practice button readiness and badges | [home-readiness.md](home-readiness.md) |
| Domain fields, relationships, and key Dexie indexes | [domain-models.md](domain-models.md) |

## Where To Look First

| Task | Primary doc | Main code entrypoint |
| --- | --- | --- |
| Understand app startup | [frontend-architecture.md](frontend-architecture.md) | `frontend/src/App.tsx` |
| Find a feature owner and its connection points | [features.md](features.md) | `frontend/src/features` |
| Debug auth/session state | [state-and-events.md](state-and-events.md) | `frontend/src/features/auth/use-auth-store.ts` |
| Change profile or account actions | [features.md](features.md) | `frontend/src/pages/Profile.tsx` |
| Debug sync or local-first writes | [data-and-sync.md](data-and-sync.md) | `frontend/src/database/utils/data-sync.utils.ts` |
| Change practice behavior | [practice-flows.md](practice-flows.md) | `frontend/src/features/practice` |
| Change Home practice buttons or sync-triggered readiness | [home-readiness.md](home-readiness.md) | `frontend/src/features/practice/HomePracticeButtons.tsx` |
| Change overview pages or reset behavior | [features.md](features.md) | `frontend/src/features/levels`, `frontend/src/features/topics` |
| Debug audio state or archive sync | [features.md](features.md) | `frontend/src/features/audio` |
| Change theme, PWA, toast, help, or overlay behavior | [features.md](features.md) | `frontend/src/features/theme`, `frontend/src/features/pwa` |
| Understand progress dates | [domain-models.md](domain-models.md) | `frontend/src/database/models/user-items.ts` |
| Debug dashboard counts | [state-and-events.md](state-and-events.md) | `frontend/src/features/user-stats/use-user-store.ts` |

## Maintenance Rule

When changing behavior that crosses feature boundaries, update the matching doc
in the same change. Tests prove behavior; these docs explain where to look and why
the behavior exists.
