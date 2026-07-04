# Practice Flows

Practice UI is shared where possible through `PracticeSessionCard`, but the deck
logic differs by mode.

## Shared Session Card

`frontend/src/features/practice/PracticeSessionCard.tsx` renders the common card:

| Control | Behavior |
| --- | --- |
| Card click | Confirms direction change or reveals answer. |
| Hint | Calls `plusHint` while unrevealed. |
| Repeat | Calls `nextRepeat` after reveal. |
| Known | Calls `nextKnown` after reveal. |
| Skip/master | Long-presses `MasterItemButton`, then calls `completeCurrent` if supplied. |
| Audio | Uses audio manager state and auto-play rules from the deck hook. |
| Grammar/note buttons | Open detail cards when IDs are available. |

See [features.md](features.md) for the broader feature map and
[home-readiness.md](home-readiness.md) for Home button availability.

## Vocabulary Practice

Route: `/practice/vocabulary`, rendered by `Practice mode="vocabulary"`.

| Step | Owner | Behavior |
| --- | --- | --- |
| Readiness on Home | `UserItem.getReadyVocabularyPracticeState` | Counts ready started vocabulary plus not-started vocabulary, capped by badge config. |
| Deck load | `usePracticeDeck` -> `UserItem.getPracticeDeck(mode="vocabulary")` | Pulls ready odd-progress items first, then even-progress items, then not-started items if needed. |
| Progress action | `nextItem(progressChange)` | Buffers updated item progress and increments daily score. |
| Save during session | `usePracticeDeck` | Saves when buffered progress reaches deck length. |
| Save on unmount | `usePracticeDeck` cleanup | Saves remaining buffered progress and triggers level refresh. |
| Save on page unload | `beforeunload` handler | Stores unsaved progress in localStorage fallback. |

## Grammar Practice

Route: `/practice/grammar`, rendered by `Practice mode="grammar"`.

| Step | Owner | Behavior |
| --- | --- | --- |
| Readiness on Home | `UserBlock.getReadyGrammarPracticeState` | Counts started grammar items with `next_at < now`; future dates feed the Home timer. |
| Deck load | `usePracticeDeck` -> `UserItem.getPracticeDeck(mode="grammar")` | Pulls ready grammar items using the shared practice deck logic, without new vocabulary fallback. |
| Progress/save | `usePracticeDeck` | Same buffering, score increment, unmount save, and unload fallback as vocabulary practice. |

## New Grammar Practice

Route: `/practice/new-grammar`, rendered by `NewGrammarPractice`.

| Step | Owner | Behavior |
| --- | --- | --- |
| Unlock check | `HomePracticeButtons` -> `UserBlock.unlockNextGrammarBlock` | Unlocks next grammar block when lesson vocabulary and previous grammar prerequisites are met. |
| Block selection | `UserBlock.getFirstUnlockedGrammarBlock` | Finds the first started, unmastered grammar block. |
| Initial content | `useNewGrammarPracticeDeck` | Loads block items and optional grammar intro detail. |
| Rounds | `useNewGrammarPracticeDeck` | Runs two rounds: Czech to English, then English to Czech. |
| Repeat waves | `useNewGrammarPracticeDeck` | Original queue runs first; repeated items move into the next wave until known. |
| Skip | `completeCurrent` | Saves the skipped item immediately with skip progress, removes it from all queues, and increments score. |
| Completion | `completeBlock` | Saves all block items to after-new-grammar progress and marks the block mastered. |

## Recalculation After Practice

When a practice route unmounts and the user returns Home:

- Vocabulary readiness is recalculated by `HomePracticeButtons`.
- Grammar readiness is recalculated by `HomePracticeButtons`.
- New grammar availability is recalculated after `unlockNextGrammarBlock`.

While Home stays mounted, readiness also reloads after successful sync through
`useSyncStore.syncRevision` and future schedule timers. Dashboard stars and level
aggregates are refreshed through `dailyCountUpdated` and `levelsUpdated`; those
events are documented in [state-and-events.md](state-and-events.md).

Practice audio uses the audio manager and per-user volume state. Grammar and note
detail buttons are local UI over shared IndexedDB content. Unsaved review
progress uses the `practiceDeckProgress_${userId}` localStorage fallback described
in [data-and-sync.md](data-and-sync.md).
