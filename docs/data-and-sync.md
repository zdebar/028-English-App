# Data and synchronization

IndexedDB is the durable local source for curriculum and user progress. Supabase provides the remote copy. The central data manager is an in-memory mirror and view-data cache; it is rebuilt from IndexedDB for the active account.

## Local writes and data-manager updates

Application commands write to IndexedDB first. After a successful commit, the model publishes changed rows or deleted keys to the manager. A failed database write does not update the in-memory snapshot. A write can finish after its calling component unmounts; account checks prevent its changes from leaking into a different active account.

The manager applies each committed batch to its base snapshot, recomputes derived review data, and rebuilds only cached page packages that depend on changed tables. Account changes clear user-specific state and cached packages. BroadcastChannel carries committed changes between tabs; user-owned rows are applied only to the matching account, while shared catalog changes can be applied by other accounts.

## Incremental remote sync

Each syncable table keeps its own cursor in IndexedDB metadata. A first pull starts at the configured epoch; later pulls use that table's saved timestamp. Cursors advance after local database work succeeds. There is no full-sync mode.

The data tables are synchronized independently. Successful table changes are merged and published to the data manager as one batch, even if another table fails. Sync tasks include shared groups, group items, group relations, levels, lessons, and notes, plus user items and lesson starts.

## Sync lifecycle and retry

**frontend/src/features/synchronization/sync-manager.ts** is the singleton coordinator used by the app lifecycle:

- It starts an initial sync three seconds after a user becomes active and repeats at the configured 24-hour interval.
- Transient task failures receive quick retries after one and three seconds.
- Remaining retryable failures are retried after one, five, and then fifteen minutes; later scheduled retries remain at fifteen minutes. Server Retry-After hints can extend the delay.
- A browser online event retries failed retryable tasks immediately.
- Authentication failures and permanent client errors are not automatically retried.
- Overlapping requests for the same account share the in-flight sync.

A session-end sync is best-effort and covers user items and lesson starts. It does not keep a closing page alive for a retry schedule. Sync status and task errors are exposed by the synchronization feature.

Audio archive synchronization is handled by the same coordinator, but audio blobs stay in the audio-record cache and are not part of the data-manager snapshot.

## Storage boundaries

| Storage | Contents |
| --- | --- |
| IndexedDB curriculum tables | Levels, lessons, notes, groups, group items, and group relations. |
| IndexedDB user tables | The active user's user items and lesson starts. |
| IndexedDB metadata | Per-table sync timestamps; not copied into the data manager. |
| IndexedDB audio tables | Cached audio blobs and archive metadata; separate from the data manager. |
| localStorage | Theme, audio volume, vocabulary search, and simulation-fixture preference. |
| sessionStorage | Temporary anonymous-session recovery during Google sign-in. |

The data manager's timers refresh time-sensitive packages when a review becomes due or the local date changes. Changes caused by elapsed time do not require an IndexedDB write.

See [state-and-events.md](state-and-events.md) for subscriptions and [domain-models.md](domain-models.md) for the local tables.
