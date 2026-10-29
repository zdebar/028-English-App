# Practice Flows

The app has three Home practice actions: grammar review, vocabulary review, and
initial training. Review routes share `PracticeCard`; initial training uses a
lesson-specific introduction and the shared practice card UI.

## Grammar And Vocabulary Review

Routes: `/practice/grammar` and `/practice/vocabulary`. `/practice` is the
grammar-review route alias. `router.tsx` loads the initial review deck from local
IndexedDB before rendering `Practice`.

A review candidate must be active, already started, unmastered in the selected
direction, enabled for that direction, and match the selected item type. The
selected direction is Czech-to-English when it has due items; if it has none, the
loader can fall back to English-to-Czech. Items are ordered by their next review
time, then curriculum order.

Each answer updates that direction's progress and schedule and is saved to
IndexedDB before the queue advances. Failed writes stay on the current item and
can be retried. After a successful write, the in-memory review arrays are updated.
If an answered item is still due, it can re-enter the queue. Leaving practice
keeps answers already saved; the remaining queue is not persisted as a session.

The card loads note and grammar detail separately from the selected review items.
Failure to load optional detail does not prevent answering the card.

## Initial Training

Route: `/practice/initial-training`, opened by the Home “New” button.

The first eligible unstarted item is selected in curriculum order. Training then
includes all eligible unstarted items from that item's lesson. A lesson cannot be
started while either review category has reached its configured review limit or
the user's daily new-lesson limit has been reached. A lesson already started that
day can be continued. The route rechecks eligibility and records the lesson start
in `user_lessons` before showing training.

The introduction shows the lesson and its items before the first prompt. A correct
answer advances to the next item. An incorrect answer adds that item to the retry
queue. Skipping completes the current item and marks it mastered. Each answer is
saved immediately to the local `user_items` record; initial progress is mirrored
to both review directions.

There is no persisted training-session table. If the page is reloaded, the route
selects the remaining eligible unstarted items from the next lesson selection.
Completed answers remain saved, while the in-memory retry order is lost.

## Grammar And Supporting Details

Grammar groups, their hierarchy, and their examples use the unified `groups`,
`group_relations`, and `group_items` data. `lessons.group_id` links a lesson to its
grammar detail. The frontend's `GrammarTopic`, `GrammarGroup`, and `GrammarChunk`
classes are query helpers over that unified model; they are not separate current
database tables.

Practice cards can display the lesson's grammar detail and linked note. Grammar
overviews arrange initiated grammar groups by hierarchy and detail relations,
then show the linked examples that are available from started lessons. An initial
training skip counts as initiated for overview visibility.
