# State And Reactive Data

This app uses Zustand for global UI/session/cache state. IndexedDB remains the
durable source for user progress, and Dexie live queries keep derived UI snapshots
current after relevant write transactions commit.

## Zustand Stores

| Store | Owner | Source of truth | Writers | Readers | Reset behavior |
| --- | --- | --- | --- | --- | --- |
| `useAuthStore` | `features/auth` | Supabase Auth session | Auth initialization, logout, Supabase listener | App shell and protected UI | Auth lifecycle owns reset. |
| `useSyncStore` | `features/synchronization` | In-memory sync status | `usePeriodicSync` | Home sync warning and sync UI | Reset when no user or sync hook unmounts. |
| `useUserStore` | `features/user-stats` | Dexie live-query snapshots | `useUserStoreSync` | Home, dashboard, practice stars | Subscriptions are replaced on user/date change and cleared on sign-out. |
| `useAudioStore` | `features/audio` | localStorage per-user volume | Audio loader and volume controls | Audio controls | Reinitialized when user changes. |
| `useThemeStore` | `features/theme` | localStorage plus system fallback | Theme loader and switch | Theme UI and DOM classes | Reloaded when user changes. |
| `useToastStore` | `features/toast` | In-memory toast state | Any feature showing a toast | `ToastContainer` | Auto-hides unless loading. |
| `useHelpStore` / `useOverlayStore` | Help and overlay features | In-memory UI state | Help/modal flows | Overlay UI | Cleared through close actions. |
| `usePwaStore` | `features/pwa` | Browser install event | Install-prompt listener | Install button | Cleared after handling. |

## Reactive IndexedDB Reads

- `useUserStoreSync(userId)` maintains live queries for the active user's level
  overview and current-date score. It also polls for a local date change so
  date-derived totals are recomputed after midnight.
- `HomePracticeButtons` maintains a live query over the active user's item/block
  readiness. Relevant Dexie commits, including progressive table commits during
  synchronization, rerun the query.
- Multi-table derived reads run in read-only Dexie transactions so each emitted
  result is a coherent database snapshot.
- Bulk writes notify observers after their transaction commits, rather than once
  per row.

## Time-Based Changes

Dexie reacts to writes, not to time passing. Home readiness therefore retains
schedule timers that promote items when `next_at` is reached. The stats bridge
retains a lightweight local-date poll for midnight rollover.

## Important Boundaries

- Stores are not durable progress storage; progress belongs in IndexedDB models.
- Writers do not dispatch dashboard refresh events. Readers observe the IndexedDB
  ranges they depend on.
- `useSyncStore` exposes status only; data refresh follows committed Dexie writes.
