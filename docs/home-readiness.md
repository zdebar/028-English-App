# Home Practice Availability

`PracticeButton` renders three actions from
`usePracticeAvailabilityStore`: New, Grammar Review, and Vocabulary Review. The
Home route loader waits for the first availability snapshot so the controls do
not briefly appear disabled while local data is loading.

| Button | Enabled when | Badge |
| --- | --- | --- |
| Grammar Review | At least one due grammar review direction-item is available. | Number of due grammar direction-items. |
| Vocabulary Review | At least one due vocabulary review direction-item is available. | Number of due vocabulary direction-items. |
| New | An eligible unstarted lesson exists, review limits are below threshold, and the daily new-lesson limit allows it. A lesson already started today can be continued. | None. |

Review availability includes both review directions. A direction-item is due
when it is active, already started, enabled for that direction, not mastered in
that direction, and its schedule is ready. Grammar and vocabulary are classified
by `user_items.is_vocabulary`.

New training selects the next eligible unstarted lesson in curriculum order. It
is blocked when either grammar or vocabulary reaches its configured review limit
or when the user's maximum number of distinct lesson starts for the local day has
been reached. The maximum is stored in `users.max_new_lessons_per_day` and can be
changed on the Profile page. Continuing a lesson already started today bypasses
both new-lesson checks.

## Refresh Behavior

`loadPracticeAvailabilitySnapshot` combines cached review arrays, the next
initial-training lesson, user settings, and today's `user_lessons` starts.
Availability is refreshed after sign-in, when the page gains focus or becomes
visible, after sync, after progress resets, and after practice writes. Review
counts are also updated after each saved answer.

The controller schedules a refresh for the next review time or the next local
day. While practice is active, it coalesces full availability refreshes until
pending writes settle and the user exits the practice route. If loading fails,
the store exposes the error state and disables the controls safely.
