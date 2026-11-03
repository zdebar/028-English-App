# Home readiness

Home reads its dashboard and practice state from the cached Home package in the central data manager. The Home route loader ensures that package for a signed-in user; the dashboard and buttons subscribe to it through **useDataPackage**.

| Action | Enabled when | Count |
| --- | --- | --- |
| Grammar review | At least one due grammar direction-item is available and the package has loaded. | Number of due grammar direction-items. |
| Vocabulary review | At least one due vocabulary direction-item is available and the package has loaded. | Number of due vocabulary direction-items. |
| Pronunciation practice | At least one pronunciation group has an active contrast. | None. |
| New training | An eligible unstarted lesson exists and neither review category has reached its configured threshold. A lesson started today can be continued. | None. |

A review direction-item must be active, initiated, enabled in its direction, not mastered in that direction, and due. Grammar and vocabulary are separated by the item's vocabulary flag.

The current review thresholds are 50 due direction-items for grammar and 50 for vocabulary. Reaching either threshold blocks starting a new lesson. This is a review-volume gate, not a daily lesson quota.

## Refresh behavior

The Home package is rebuilt when a relevant committed row changes, a sync batch updates its dependencies, another tab publishes a change, or time reaches a review date or a new local day. The package contains level progress, practice availability, active pronunciation availability, and sound groups.

There is no separate Home availability store or focus/visibility refresh controller. The route loader waits for the package and the page remains subscribed to the same package. If package preparation fails, its error state is exposed to the UI.
