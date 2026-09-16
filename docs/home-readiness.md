# Home Practice Readiness

`PracticeButtons` renders Review and New controls from a shared availability store. The store is
Home-scoped: its Dexie subscription is stopped while Practice is active and restarted when Home is
entered.

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
While the Home calculation is pending, both practice controls remain disabled so stale availability
cannot be used.
