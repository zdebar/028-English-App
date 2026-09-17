# Home Practice Readiness

`PracticeButtons` renders Review and New controls from a shared availability store. The Home route
waits for the first availability snapshot before rendering. After Home is mounted, its Dexie
subscription keeps the store current and is stopped while Practice is active.

| Control | Ready condition | Badge | Refresh |
| --- | --- | --- | --- |
| Review | Threshold readiness reaches the configured minimum, or a review session is active | None | Asynchronous Home-scoped Dexie readiness query and future schedule timer |
| New | Review is below its boundary and the lowest ordered unstarted practice block has items, or a valid new session is active | None | Asynchronous Home-scoped Dexie live query over items, blocks, and sessions |

Home readiness includes all unmastered practice items regardless of vocabulary/grammar
classification: due scheduled items plus reset items. It performs capped indexed scans and stops as
soon as the minimum threshold is known; it never calculates the exact review total. If the threshold
is not currently met, it records the date of the future item that would reach it and schedules a
refresh for that date.

Review has priority at its boundary. Invalid new sessions are removed before availability is
published, so a removed, started, or empty block cannot keep overriding current block ordering.
The Home route does not render while its initial availability calculation is pending, so users do
not see a default-disabled practice state. If a later refresh fails, both practice controls use the
safe disabled/error state from the store.
