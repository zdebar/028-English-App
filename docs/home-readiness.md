# Home Practice Readiness

`HomePracticeButtons` owns the enabled/disabled state and badges for the three
practice buttons on Home.

## Button Contracts

| Button | Enabled when | Badge source | Recalculated when | Auto-updates while Home is open |
| --- | --- | --- | --- | --- |
| Vocabulary | `UserItem.getReadyVocabularyPracticeState(userId).readyCount > 0` | Ready vocabulary count, capped by `config.practice.readyPracticeBadgeCap` | Relevant Dexie commits or `userId` change | Yes, using live queries and future schedule timers. |
| New grammar | `UserBlock.getFirstUnlockedGrammarBlock(userId) != null` after unlock attempt | No badge | Relevant Dexie commits or `userId` change | Yes through the live query. |
| Grammar | `UserBlock.getReadyGrammarPracticeState(userId).readyCount > 0` | Ready grammar count, capped by `config.practice.readyPracticeBadgeCap` | Relevant Dexie commits or `userId` change | Yes, using live queries and future schedule timers. |

## Load Sequence

On mount or `userId` change, `HomePracticeButtons`:

1. Resets local button state to disabled/empty.
2. Subscribes to a read-only transaction that loads vocabulary readiness, the
   first unlocked grammar block, and grammar readiness.
3. Updates button enabled state, badges, and future schedules on each emission.
4. Runs `UserBlock.unlockNextGrammarBlock(userId)` as an idempotent follow-up;
   an actual unlock creates another emission.

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

Practice actions and synchronization write IndexedDB through Dexie.
`HomePracticeButtons` observes the relevant item/block ranges directly and uses
its own future schedule timers while Home remains mounted.
