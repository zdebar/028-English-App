# Data And Sync

The app is local-first for user progress. User actions update IndexedDB first;
sync later pushes local changes and pulls remote deltas.

## Local-First Rule

| Action type | Local write | Remote write |
| --- | --- | --- |
| Practice progress | `UserItem.savePracticeDeck`, `UserScore.addItemCount`, block helpers | Later via `dataSync` / `dataSyncOnUnmount`. |
| New grammar completion | `UserItem.saveNewGrammarBlockCompletion`, `UserBlock.markBlockMastered` | Later via sync. |
| Reset progress | `UserItem.reset*`, `UserBlock.resetByBlockId` | Later via sync. |
| Daily score | `UserScore` model | Later via sync. |

UI should generally read from local models and stores, not directly from Supabase.

## Sync Lifecycle

`frontend/src/database/utils/data-sync.utils.ts` is the central sync entrypoint.

| Moment | Owner | Behavior |
| --- | --- | --- |
| App mount with user | `usePeriodicSync` | Schedules initial sync after a short delay. |
| Periodic interval | `usePeriodicSync` | Runs `dataSync(userId)` at `config.sync.periodicSyncInterval`. |
| App/unmount cleanup | `usePeriodicSync` | Calls `dataSyncOnUnmount(userId)` for user tables. |
| Logout | `useAuthStore.handleLogout` | Runs `dataSyncOnUnmount` unless explicitly skipped. |
| Full sync decision | `dataSync` | Uses localStorage full-sync timestamp and `config.sync.fullSyncInterval`. |

`usePeriodicSync` avoids overlapping syncs by reusing an in-flight promise.
On success it sets sync status flags and then syncs/removes audio archive records.
Committed model writes progressively refresh matching Dexie live queries. On
failure it sets the sync error flag and leaves local-first reads available.

## Full Sync vs Incremental Sync

| Mode | Trigger | Behavior |
| --- | --- | --- |
| Full sync | Explicit `fullSync` or stale full-sync timestamp | Replaces local user/shared data from remote where model supports it. |
| Incremental sync | Normal periodic sync | Pushes local changes since last metadata timestamp and pulls remote deltas/deletes. |

Shared content models include `Grammar`, `Levels`, `Lessons`, and `Notes`. User
models include `UserBlock`, `UserScore`, and `UserItem`.

## Model Map

| Model | Table/domain | Common readers/writers |
| --- | --- | --- |
| `UserItem` | Per-user item progress and scheduling | Practice decks, vocabulary/grammar readiness, resets, sync. |
| `UserBlock` | Per-user block unlock/completion state | Home new grammar button, new grammar practice, topics, sync. |
| `UserScore` | Per-user daily item count | Practice actions, daily stats, overview stars. |
| `Levels` / `Lessons` | Shared course hierarchy | Dashboard and overview pages. |
| `Grammar` / `Notes` | Shared detail content | Practice detail buttons and overview pages. |
| `AudioRecord` / `AudioMetadata` | Audio availability/cache metadata | Audio loader and periodic sync. |

## LocalStorage Uses

| Key pattern | Owner | Purpose |
| --- | --- | --- |
| `practiceDeckProgress_${userId}` | `usePracticeDeck`, `restoreUnsavedFromLocalStorage` | Recover unsaved practice progress after unload/save failure. |
| `last-full-sync-at_${userId}` | `sync-time.utils` | Decide when the next full sync is needed. |
| `theme_${userId}` / guest key | `theme-utils`, `useThemeStore` | Persist selected theme. |
| `volume-${userId}` | `useAudioStore` | Persist audio volume. |
| `vocabulary_search_term_${userId}` | vocabulary overview | Persist vocabulary search UI state. |
| `simulate-data-${userId}` | `SimulateDataButton` | Persist simulation toggle for anonymous/test workflows. |

## Reactive Refresh After Data Changes

Dashboard statistics and Home readiness observe their IndexedDB inputs through
Dexie live queries. Each relevant committed write transaction can publish a new
coherent snapshot; multi-table synchronization may therefore update the UI
progressively. Schedule timers still handle readiness changes caused only by time.
