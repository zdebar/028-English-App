# Home Practice Readiness

`HomePracticeButtons` owns the enabled/disabled state and badges for the three
practice buttons on Home.

## Button Contracts

| Button | Enabled when | Badge source | Recalculated when | Auto-updates while Home is open |
| --- | --- | --- | --- | --- |
| Vocabulary | `UserItem.getReadyVocabularyPracticeState(userId).readyCount > 0` | Ready vocabulary count, capped by `config.practice.readyPracticeBadgeCap` | Home mount, user change, page refresh, returning to Home | Yes, using future schedule timer when count starts at `0`. |
| New grammar | `UserBlock.getFirstUnlockedGrammarBlock(userId) != null` after unlock attempt | No badge | Home mount, user change, page refresh, returning to Home | No timer; recalculates on reload/remount. |
| Grammar | `UserBlock.getReadyGrammarPracticeState(userId).readyCount > 0` | Ready grammar count, capped by `config.practice.readyPracticeBadgeCap` | Home mount, user change, page refresh, returning to Home | Yes, using future schedule timer when count starts at `0`. |

## Load Sequence

On mount or user change, `HomePracticeButtons`:

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

There is no global live subscription for Home readiness counts. Practice actions
write IndexedDB and refresh dashboard stats through global events, but Home
practice-button readiness is recalculated by mounting/reloading `HomePracticeButtons`
or by its own future schedule timer while Home remains mounted.
