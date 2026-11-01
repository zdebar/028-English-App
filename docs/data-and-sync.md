# Data And Sync

The app runs as a PWA with frontend data in IndexedDB and Supabase as the remote store.

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

## Date-Based Sync

`dataSync` synchronizes `groups`, `group_items`, `group_relations`, `levels`,
`lessons`, `notes`, `user_items`, and `user_lessons`. Each table uses its own
timestamp in the IndexedDB `metadata` table. When a table has no saved timestamp,
its first pull starts at the configured epoch date.

Shared content tables pull rows whose `updated_at` is newer than the stored
timestamp. Active rows are upserted locally and remote tombstones remove their
local rows. User items push local changes and merge remote changes within the
date window, preserving concurrent local edits. Lesson-start history uses
`started_at` as its cursor and merges local and remote entries in that window.
Each cursor advances only after the corresponding local write succeeds.

| Moment | Owner | Behavior |
| --- | --- | --- |
| User becomes active | `usePeriodicSync` | Warms practice and overview caches and schedules the first sync after three seconds. |
| Periodic interval | `usePeriodicSync` | Runs `dataSync`; the default interval is one day. |
| App unmount or logout | `dataSyncBeforeSessionEnd` / `handleLogout` | Best-effort date-based sync of user items and lesson starts when a session exists. |

Overlapping periodic syncs reuse the current promise. A completed data sync
invalidates and rebuilds practice caches and refreshes Home availability. Audio
archive sync then checks remote bucket metadata, downloads changed archives,
updates local audio records, and removes records no longer referenced by items.
Sync status lives in `useSyncStore`; failure leaves local reads available and
sets the Home sync warning.

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
