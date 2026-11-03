# Practice flows

Practice has three learner actions: grammar review, vocabulary review, and initial training. Pronunciation practice is reached from its own Home button and overview route.

## Grammar and vocabulary review

Routes are **/practice**, **/practice/grammar**, and **/practice/vocabulary**. The first two open grammar review. Their route loaders ensure a review package before navigation; the page subscribes to that same package through **useDataPackage**.

Candidates must be active, initiated, not mastered in the chosen direction, enabled in that direction, and due. When a review package is first built, Czech-to-English is selected if it has due items; otherwise it can fall back to English-to-Czech. Items are ordered by schedule and curriculum position.

The package includes review entries, fallback decks, availability, sound groups, and each entry's note and grammar context. When an answer is submitted, the local write completes before the queue advances. If it fails, the current item remains available to retry. Successful writes update the data manager.

The current queue remains local to the active practice session. Updated package data does not reorder it; the new package is used by the next session. A still-due answered item may re-enter the queue according to the active queue rules.

## Initial training

Route: **/practice/initial-training**. The loader prepares the next eligible lesson before navigation. It includes its items, grammar context, note, and sound groups.

The route selects unstarted items from the next eligible lesson in curriculum order. The lesson start is recorded in user_lessons. A new lesson is unavailable when either grammar or vocabulary has reached its configured review threshold; a lesson already started today can be continued.

Each answer is saved immediately to the local user_items row. Correct answers advance; incorrect answers enter the in-memory retry queue; skipping marks the item complete. Training progress is reflected in the review directions.

There is no persisted practice-session table. Reloading reconstructs the next eligible lesson from saved progress; the in-memory retry order is lost.

## Grammar context

Grammar structures and examples come from groups, group_relations, and group_items. lessons.group_id connects a lesson to its grammar context. These fields are assembled by data-package builders rather than loaded separately by the page.
