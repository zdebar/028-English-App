# Home Practice Readiness

`HomePracticeButtons` renders one unified Practice button.

| Control | Ready condition | Badge | Refresh |
| --- | --- | --- | --- |
| Practice | `UserItem.getReadyPracticeState(userId).readyCount > 0` | Unified ready count, capped as `99+` by configuration | Dexie live query, user change, and future schedule timer |

Readiness includes all unmastered practice items regardless of vocabulary/grammar classification:
due scheduled items plus never-scheduled items. Future `next_at` values are grouped into a timer
schedule so the badge updates while Home remains mounted.

New grammar has no separate Home button. It is discovered inside the unified deck when a new item
belongs to a grammar block whose `started_at` is still the local null-replacement date.
