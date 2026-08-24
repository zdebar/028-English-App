# Home Practice Readiness

`PracticeButtons` renders Review and New controls from a shared live availability store.

| Control | Ready condition | Badge | Refresh |
| --- | --- | --- | --- |
| Review | Ready review count reaches the configured star size, or a review session is active | None | Dexie live query, user change, and future schedule timer |
| New | Review is below its boundary and the lowest ordered unstarted practice block has items, or a valid new session is active | None | Dexie live query over items, blocks, and sessions |

Readiness includes all unmastered practice items regardless of vocabulary/grammar classification:
due scheduled items plus never-scheduled items. Future `next_at` values are grouped into a timer
schedule so the badge updates while Home remains mounted.

Review has priority at its boundary. Invalid new sessions are removed before availability is
published, so a removed, started, or empty block cannot keep overriding current block ordering.
