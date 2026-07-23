# Practice Flows

Practice uses one review route and the shared `PracticeSessionCard`. New grammar temporarily
interrupts the unified deck and returns to it after completion.

## Unified Practice

Route: `/practice`, rendered by `Practice` and `usePracticeDeck`.

`UserItem.getPracticeDeck` does not filter by `is_vocabulary`:

1. Select due, unmastered practice items with odd progress, ordered by `next_at`. Return immediately when this fills the deck.
2. Otherwise build an alternative deck from due even-progress items, then never-scheduled items in curriculum order.
3. While scanning new items, a non-null `grammar_chunk_id` whose block has no `started_at` becomes the final marked trigger item; selection stops immediately.
4. Return the even/new alternative when non-empty, otherwise return the partial odd deck.

Progress is buffered during the session, saved at deck completion/unmount, and backed up to
`practiceDeckProgress_${userId}` on unload or save failure.

## New Grammar Interruption

Route: `/practice/new-grammar`, entered with the trigger block ID selected by the unified deck.

The flow loads that exact block and its grammar chunk, displays the chunk introduction, and runs
the existing Czech-to-English and English-to-Czech rounds with repeat waves. Completion starts
all block items at the configured grammar progress, starts and masters the block, and returns to
`/practice` for a fresh deck. Leaving early keeps the block unstarted, so it triggers again later.

There is no vocabulary or previous-grammar unlock prerequisite.

## Grammar Details

Practice cards resolve their detail button through `user_items.grammar_chunk_id` and display only
that chunk. The grammar overview lists started groups and composes only their started chunks in
configured order; ungrouped chunks are omitted.
