# State And Reactive Data

Zustand holds session, UI, availability, and cached display state. IndexedDB holds
the durable local records for content and user progress. Dexie `liveQuery` keeps
derived views current after transactions that touch their source tables.

## Zustand Stores

| Store | Owner | Holds | Main refresh/reset behavior |
| --- | --- | --- | --- |
| `useAuthStore` | `features/auth` | Current user, email/name, anonymous state, auth loading, identity-link conflict | Initialized by the auth lifecycle; cleared on sign-out or invalid session. |
| `useSyncStore` | `features/synchronization` | Sync status and errors | Updated by periodic, full, and unmount sync flows; reset when there is no active user. |
| `usePracticeAvailabilityStore` | `features/practice` | Grammar/vocabulary due counts, next review time, next lesson availability, daily lesson limit | Rebuilt by the availability controller after sign-in, sync, reset, practice, focus, or visibility changes. |
| `useUserStore` | `features/user-stats` | Level and lesson overview snapshot | Filled from an observed IndexedDB query and cleared on sign-out. It does not hold daily score records. |
| `usePronunciationGroupsStore` | `features/pronunciation` | Pronunciation group overview, loading, and error state | Loaded from the local unified group model when the overview is mounted. |
| `useAudioStore` | `features/audio` | Active user and volume | Initialized from `volume-${userId}` in localStorage. |
| `useThemeStore` | `features/theme` | Current theme | Loaded from user/guest localStorage preferences and applied to the document. |
| `useToastStore`, `useHelpStore`, `useOverlayStore`, `usePwaStore` | UI features | Transient notices, help, overlay callbacks, install prompt | Updated and cleared by their respective UI flows. |

## IndexedDB Observers

`frontend/src/hooks/shared-query-store.ts` shares a Dexie `liveQuery` subscription
between consumers of the same user-scoped query. `useLiveQueryData` uses that
store for overview pages and subscribes directly when no shared key is supplied.
The observer reruns when a table read by its query changes; it does not need a
custom dashboard event.

The Home dashboard uses `useUserStoreSync` to observe `Levels.getOverview`. That
query combines local levels, lessons, user items, and `user_lessons` start records
in a read-only transaction. The hook checks the local date once a minute so
started-today counts roll over after midnight.

## Practice Availability Updates

Availability is an explicit snapshot in `usePracticeAvailabilityStore`, not a
continuous Dexie subscription. `usePracticeAvailabilityStoreSync` loads it for the
active user and refreshes it when the window gains focus or the document becomes
visible. The Home route loader waits for the first snapshot.

Practice writes update the in-memory review arrays after each saved answer.
`usePracticeAvailabilityBoundary` tracks pending writes and coalesces a full
availability refresh until practice exits. Progress reset actions invalidate the
review cache and refresh availability. Sync invalidates and rebuilds the practice
cache after applying remote changes.

The availability controller also schedules a timer for the next review time or
the next local day. This refresh covers changes caused by time passing, which
Dexie itself does not observe.

## Important Boundaries

- IndexedDB model rows are the durable local progress source. Zustand snapshots
  and in-memory review arrays are caches.
- A review answer is saved before the queue advances; failed saves can be retried.
- Initial-training answers are also saved per item. The current queue is
  component state, not a persisted session table.
- `useSyncStore` reports synchronization status. Dexie queries and explicit
  availability refreshes update feature data.
