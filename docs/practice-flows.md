# Practice Flows

Practice uses separate review and initial-training routes with the shared `PracticeSessionCard`.

## Unified Practice

Route: `/practice`, rendered by `Practice` and `usePracticeDeck`.

`UserItem.getPracticeDeck` does not filter by `is_vocabulary`:

1. Select due, unmastered practice items with odd progress, ordered by `next_at`. Return immediately when this fills the deck.
2. Otherwise build an alternative deck from due even-progress items, then never-scheduled items in curriculum order.
3. Return the even/new alternative when non-empty, otherwise return the partial odd deck.

Progress is buffered during the session, saved at deck completion/unmount, and backed up to
`practiceDeckProgress_${userId}` on unload or save failure.

## Initial Training

Route: `/practice/initial-training`, entered from the Home “Nové” button.

Home selects the first unstarted item by level, lesson, and item order. A blockless item starts an
automatic batch of up to `config.practice.initialTrainingBatchSize` items with the same lesson and
`is_vocabulary` value. The batch stops before an explicit block. An item with `block_id` loads all
currently unstarted members of that explicit block and displays its introduction before the four
training rounds. Completion starts the exact session items, removes the session, and returns Home.
Empty blocks and blocks without unstarted items are ignored.

Saved sessions retain their exact item IDs. Newly synchronized items are offered only after the
active session completes. There is no previous-block or grammar unlock prerequisite.

## Grammar Details

Regular and training practice cards resolve their detail button through the item-derived
`user_items.grammar_chunk_id` and display that chunk with every explicitly ordered
`grammar_chunk_examples` item. Every chunk belongs to a grammar group. The grammar overview uses
the group name and note, then composes only its started chunks in group-specific order while
showing every curated example for each visible chunk.
