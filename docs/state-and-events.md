# State and data updates

IndexedDB holds durable curriculum and user progress. The central data manager in **frontend/src/database/state/** keeps the active user's in-memory snapshot, derived practice data, and prepared packages for pages.

## Data manager

The data manager is a vanilla Zustand store exposed to React through **useDataPackage**. Its state contains:

- Shared local curriculum rows: levels, lessons, notes, groups, group items, and group relations.
- The active user's local user items and lesson-start records.
- Derived review arrays and the next initial-training lesson.
- Typed, lazily prepared page packages for Home, overview menus, content overviews and details, review decks, and initial training.
- The current time and local date used to rebuild time-sensitive packages.

Audio blobs and sync metadata are deliberately outside this state.

## Route loading and page subscriptions

A route loader calls **ensureDataPackage** before navigation completes. The page then calls **useDataPackage** with the same typed request and receives the cached package plus future updates. Package requests include detail IDs or review kind in their cache key.

This separates waiting from rendering: loaders establish readiness, while page subscriptions keep displayed data current. Components may still call database model commands for writes such as progress resets; those commands publish their committed row changes back to the manager.

## Update paths

| Event | Data-manager behavior |
| --- | --- |
| Account initialization | Loads a local IndexedDB snapshot and derives review state. An account switch discards the previous account's data and packages. |
| Successful local write | Applies published row changes after IndexedDB commit and rebuilds affected cached packages. |
| Failed local write | Leaves the in-memory snapshot and packages unchanged. |
| Remote sync | Merges successful table deltas and publishes one batch, including partial success when another table failed. |
| Another tab changes data | Applies account-matched user changes and shared catalog changes from BroadcastChannel. |
| Time reaches a review date or a new local day begins | Refreshes time-dependent packages without rereading IndexedDB. |

Existing practice queues remain local to the active session. A data update changes the package for later sessions without reordering the queue under the learner.

## Other shared stores

Feature Zustand stores hold concerns that are not page curriculum data:

| Store area | Examples |
| --- | --- |
| Authentication | Current account, identity state, loading and auth errors. |
| Synchronization | Progress, failed tasks, retry time, and user-facing sync status. |
| Audio and theme | Volume and theme preferences. |
| UI | Toasts, help state, overlay callbacks, and PWA install prompt. |

This replaces the old independent availability snapshots and IndexedDB live-query stores. See [data-and-sync.md](data-and-sync.md) for persistence and retry behavior.
