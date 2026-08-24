# Practice Flows

Practice uses separate review and initial-block routes with the shared `PracticeSessionCard`.

## Unified Practice

Route: `/practice`, rendered by `Practice` and `usePracticeDeck`.

`UserItem.getPracticeDeck` does not filter by `is_vocabulary`:

1. Select due, unmastered practice items with odd progress, ordered by `next_at`. Return immediately when this fills the deck.
2. Otherwise build an alternative deck from due even-progress items, then never-scheduled items in curriculum order.
3. Return the even/new alternative when non-empty, otherwise return the partial odd deck.

Progress is buffered during the session, saved at deck completion/unmount, and backed up to
`practiceDeckProgress_${userId}` on unload or save failure.

## Initial Block Training

Route: `/practice/block-training?blockId=...`, entered from the Home “Nové” button.

Home selects the lowest `sort_order` block that is a practice block, unstarted, and non-empty.
The flow loads that exact block, displays its introduction and items, and runs four staged rounds.
Completion starts the block items, marks the block started, removes the session, and returns Home.
Home then recalculates the next lowest eligible block. Empty blocks are ignored.

There is no vocabulary, previous-block, or grammar unlock prerequisite.

## Grammar Details

Regular and training practice cards resolve their detail button through the item-derived
`user_items.grammar_chunk_id` and display that chunk with every explicitly ordered
`grammar_chunk_examples` item. Every chunk belongs to a grammar group. The grammar overview uses
the group name and note, then composes only its started chunks in group-specific order while
showing every curated example for each visible chunk.
