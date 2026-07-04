# Home Practice Readiness

`HomePracticeButtons` owns the enabled/disabled state and badges for the three
practice buttons on Home.

## Button Contracts

| Button | Enabled when | Badge source | Recalculated when | Auto-updates while Home is open |
| --- | --- | --- | --- | --- |
| Vocabulary | `UserItem.getReadyVocabularyPracticeState(userId).readyCount > 0` | Ready vocabulary count, capped by `config.practice.readyPracticeBadgeCap` | Home mount, `userId` change, or successful sync via `useSyncStore.syncRevision` | Yes, using successful sync reloads and future schedule timers. |
| New grammar | `UserBlock.getFirstUnlockedGrammarBlock(userId) != null` after unlock attempt | No badge | Home mount, `userId` change, or successful sync via `useSyncStore.syncRevision` | Yes for sync reloads; no future-date timer. |
| Grammar | `UserBlock.getReadyGrammarPracticeState(userId).readyCount > 0` | Ready grammar count, capped by `config.practice.readyPracticeBadgeCap` | Home mount, `userId` change, or successful sync via `useSyncStore.syncRevision` | Yes, using successful sync reloads and future schedule timers. |

## Load Sequence

On mount, `userId` change, or `syncRevision` change, `HomePracticeButtons`:

1. Resets local button state to disabled/empty.
2. Calls `UserBlock.unlockNextGrammarBlock(userId)`.
3. Loads vocabulary readiness, first unlocked grammar block, and grammar readiness.
4. Updates button enabled state, badges, and future schedules.

On loading error, all practice buttons that depend on loaded readiness are disabled
and the error is reported.

## Schedule Timers

Vocabulary and grammar readiness return schedules with grouped future dates.
`HomePracticeButtons` starts a timer for the first schedule entry:

1. When the timer fires, all overdue schedule entries are removed.
2. Their counts are added to the visible ready count.
3. If more future entries remain, another timer is scheduled by React effect.

The maximum timer delay comes from `config.practice.maxReadyScheduleTimerDelayMs`.

## Important Boundary

Home readiness is not refreshed by dashboard events. Practice actions write
IndexedDB and refresh dashboard stats through global events, while
`HomePracticeButtons` refreshes from local models on mount, `userId` changes,
successful syncs signaled by `useSyncStore.syncRevision`, and its own future
schedule timers while Home remains mounted.
