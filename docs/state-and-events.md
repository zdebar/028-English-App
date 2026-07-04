# State And Events

This app uses Zustand for global state and a small number of browser events for
cross-feature refreshes. IndexedDB remains the durable source for user progress;
stores hold UI/session/cache state.

## Zustand Stores

| Store | Owner | Source of truth | Writers | Readers | Reset behavior |
| --- | --- | --- | --- | --- | --- |
| `useAuthStore` | `features/auth` | Supabase Auth session | `initializeAuth`, `handleLogout`, Supabase auth listener | `App`, protected pages, auth/profile UI | Cleared on logout or missing session. |
| `useSyncStore` | `features/synchronization` | In-memory sync status and successful-sync revision | `usePeriodicSync` | `Home` sync warning, sync-related UI, `HomePracticeButtons` readiness reloads | Reset when no user or sync hook unmounts. |
| `useUserStore` | `features/user-stats` | IndexedDB model queries | `reloadLevels`, `reloadDailyCount`, global events | `Home`, dashboard, practice stars | Cleared when `useUserStoreSync` sees `userId === null`. |
| `useAudioStore` | `features/audio` | localStorage per-user volume | `useAudioLoader`, `VolumeSlider` | `VolumeSlider`, audio controls | Reinitialized when user changes. |
| `useThemeStore` | `features/theme` | localStorage per-user/guest theme plus system fallback | `useThemeLoader`, `ThemeSwitch` | Theme UI and DOM classes | Reloaded when user changes; can clear per user. |
| `useToastStore` | `features/toast` | In-memory toast state | Any feature calling `showToast` | `ToastContainer` | Auto-hides after config duration unless loading toast. |
| `useHelpStore` | `features/help` | In-memory help overlay state | `HelpButton`, close callbacks | `HelpText`, help UI | Closed through help action or overlay close callback. |
| `useOverlayStore` | `features/overlay` | In-memory overlay state and one close callback | Help/modal-like flows | `OverlayMask`, close controls | Close clears callback after running it. |
| `usePwaStore` | `features/pwa` | Browser `beforeinstallprompt` event | `InstallPwaButton` listener | Install button | Cleared after prompt handling. |

## Global Events

Events are dispatched through `frontend/src/utils/dashboard.utils.ts` and listened
to by `useUserStore`.

| Event | Detail | Dispatchers | Listener behavior |
| --- | --- | --- | --- |
| `levelsUpdated` | `{ userId }` | sync completion, item/block reset and progress writes | Calls `useUserStore.reloadLevels(userId)`. |
| `dailyCountUpdated` | `{ userId, dailyCount? }` | sync completion, score updates | If `dailyCount` is present, sets it directly; otherwise reloads from `UserScore`. |

## Sync Revision

`useSyncStore.syncRevision` is a monotonic in-memory counter. `setSynchronized(true)`
increments it after a successful sync; `setSynchronized(false)` does not. Home
practice readiness uses this counter to reload local IndexedDB readiness after
new data arrives from sync, while dashboard stats still use the browser events
above.

## Store Synchronization Hooks

| Hook | Mounted by | Purpose |
| --- | --- | --- |
| `useUserStoreSync(userId)` | `App` | Clears user stats on sign-out; triggers initial stat reload events on sign-in. |
| `useDailyStatsReset(userId)` | `App` | Polls for date change and reloads level/daily stats after midnight. |
| `useAudioLoader(userId)` | `App` | Initializes volume state from `volume-${userId}` localStorage. |
| `useThemeLoader(userId)` | `App` | Loads and applies user or guest theme. |
| `usePeriodicSync(userId)` | `App` | Drives sync lifecycle and sync status store. |

## Important Boundaries

- Stores should not be treated as durable progress storage. Progress belongs in
  IndexedDB models.
- Global events refresh dashboard stats; `syncRevision` refreshes Home practice
  readiness after successful sync.
- Home practice readiness recalculates on Home mount, `userId` change,
  successful sync, and future schedule timers while Home remains mounted.
