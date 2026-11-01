# Data And Sync

App works as PWA applicatin with frontend data storage inside IndexedDB. Backend on Supabase serves as secure longterm storage. 

| Place | Storage type |
| --- | --- |
| Backend | Supabase PostgreSQL |
| Frontend | IndexedDB | 

## Local Writes

| Action | Local write |
| --- | --- |
| Review answer | Saves each `user-item` progress individually immediately after advancing to next |
| Initial-training answer | Save each `user-item` with default starting values individually immediately after advancing to next | 
| Lesson start | Save each `user-lesson` immediately after starting each initial training | 
| Progress reset | Update the affected local `user_items` rows. | 

## Sync Lifecycle

`frontend/src/database/utils/data-sync.utils.ts` synchronizes `groups`, `group-items`,
`group-relations`, `levels`, `lessons`, `notes`, `user-items`, `user-lessons`, and `user-settings`.

`updated_at` - Attribute common for most tables. Determines which record is newer. Records newer than last updated table at `metadata` table is push to backend. Records pulled back with newer `updated_at` are saved to IndexedDB.

`deleted_at` - Attribute common for most tables. Determines which record ws



| Moment | Owner | Behavior |
| --- | --- | --- |
| User becomes active | `usePeriodicSync` | Warms practice and overview caches and schedules the first sync after three seconds. |
| Periodic interval | `usePeriodicSync` | Runs `dataSync`; the default interval is one day. |
| Full sync due | `dataSync` | Uses the per-user localStorage timestamp; the default interval is seven days. |
| App unmount or logout | `dataSyncBeforeSessionEnd` / `handleLogout` | Best-effort incremental sync of user items and lesson starts when a session exists. |
| Profile full-sync action | `Profile` | Forces a full data sync, refreshes audio archives, and removes orphaned local audio. |

Overlapping periodic syncs reuse the current promise. A completed data sync
invalidates and rebuilds practice caches and refreshes Home availability. Audio
archive sync then checks remote bucket metadata, downloads changed archives,
updates local audio records, and removes records no longer referenced by items.
Sync status lives in `useSyncStore`; failure leaves local reads available and
sets the Home sync warning.

## Full And Incremental Sync

| Mode | Behavior |
| --- | --- |
| Full | Reads from the epoch cursor and replaces local shared rows where supported. User-item sync reconciles remote results while preserving changes made during the sync. |
| Incremental | Pushes local changes newer than the stored cursor, then applies remote changes within the sync window. |

Sync cursors are stored in the local Dexie `metadata` table. The full-sync
throttle timestamp is stored under `last-full-sync-at_${userId}` in localStorage.

## Local And Browser Storage

| Storage | Key/data | Purpose |
| --- | --- | --- |
| IndexedDB `user_items` | Item content plus per-user progress locally | Practice, review scheduling, and incremental sync. |
| IndexedDB `user_lessons` | User, lesson, and start timestamp | Lesson start status and continuation. |
| IndexedDB `metadata` | Table name, optional user ID, sync timestamp | Incremental sync cursors. |
| IndexedDB `audio_records`, `audio_metadata` | Audio blobs and archive timestamps | Offline audio playback and archive refresh. |
| localStorage | `theme_${userId}`, `theme_guest`, `theme_active` | Theme preference and pre-paint theme. |
| localStorage | `volume-${userId}` | Per-user playback volume. |
| localStorage | `vocabulary_search_term_${userId}` | Vocabulary search text. |
| localStorage | `simulate-data-v2-${userId}` | Whether the anonymous-user fixture was applied. |
| sessionStorage | `google-signin-anonymous-session-fallback` | Short-lived anonymous-session recovery during Google sign-in. |

The simulation fixture updates vocabulary progress in the first 100 curriculum
lessons that contain vocabulary and records those lessons as started. It waits
for the initial sync and requires confirmation. Practice answers and the active
review/training queue are not stored in localStorage.

## Reactive Refresh

Overview and dashboard queries use Dexie `liveQuery` observers, which rerun when
their IndexedDB inputs change. Home practice availability uses an explicit
controller and in-memory caches. It refreshes after sync, progress reset, and
practice writes, and schedules a timer for review due times and local-day
rollover. See [state-and-events.md](state-and-events.md) and
[home-readiness.md](home-readiness.md) for those refresh paths.
