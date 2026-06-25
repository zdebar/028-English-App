# Domain Models

The frontend stores shared content and per-user progress in IndexedDB through
Dexie models under `frontend/src/database/models`.

## Core Progress Fields

| Field | Meaning |
| --- | --- |
| `progress` | Numeric SRS/progress level. Practice increments/decrements it; skip adds a large configured value. |
| `progress_history` | Array of progress snapshots for item history/testing workflows. |
| `started_at` | First time the user started an item/block. Null is represented by config's null replacement date. |
| `next_at` | When the item/block is next ready. Null replacement date means not scheduled/not started depending on context. |
| `mastered_at` | Completion/mastery timestamp. Null replacement date means not mastered. |
| `deleted_at` | Soft-delete timestamp. Null replacement date means not deleted. |
| Null replacement date/number | IndexedDB index-friendly stand-ins from `config.database`. |

## Main Relationships

| Entity | Relationship |
| --- | --- |
| `levels` | Contain lessons and support dashboard/overview grouping. |
| `lessons` | Contain blocks/items through lesson IDs. |
| `blocks` / `user_blocks` | Group vocabulary or grammar work. User blocks track unlock/mastery state. |
| `items` / `user_items` | Individual vocabulary or grammar practice units. User items track progress and scheduling. |
| `grammar` | Shared grammar detail content, linked by `grammar_id`. |
| `notes` | Shared note/detail content, linked by `note_id`. |
| `user_scores` | Per-user daily practice count. |

Vocabulary items have `is_vocabulary = 1`. Grammar items have `is_vocabulary = 0`.

## Important Model Responsibilities

| Model | Responsibility |
| --- | --- |
| `UserItem` | Practice deck creation, item progress saves, vocabulary readiness, item resets, user item sync. |
| `UserBlock` | Grammar block unlocks, new grammar availability, grammar readiness, block mastery/reset, user block sync. |
| `UserScore` | Daily practice count creation, incrementing, and sync. |
| `Levels` | Dashboard/overview progress aggregation. |

## Key IndexedDB Indexes

Declared in `frontend/src/database/models/app-db.ts`.

| Index | Used for |
| --- | --- |
| `[user_id+item_id]` | Direct user item lookup/reset/update. |
| `[user_id+block_id]` | Block item loading and block reset operations. |
| `[user_id+grammar_id+started_at]` | Grammar-related started item queries and resets. |
| `[user_id+is_vocabulary+started_at]` | Started vocabulary queries. |
| `[user_id+started_at]` | Started block/grammar discovery. |
| `[user_id+updated_at]` | Incremental sync push windows. |
| `[user_id+is_vocabulary+next_at+mastered_at+sort_order]` | Practice deck queries and vocabulary/grammar readiness. |
| `[user_id+lesson_id+is_vocabulary+started_at]` | Checks whether lesson vocabulary is started before grammar unlock. |

## Readiness Meaning

| Practice type | Ready item condition |
| --- | --- |
| Vocabulary | Not mastered and either `next_at < now` or `next_at` equals the null replacement date. |
| Grammar review | Not mastered, already started/scheduled, and `next_at < now`. |
| New grammar | A grammar block is unlocked, started, and not mastered. |

Readiness is a UI availability concept. Actual practice deck creation still
queries the model again when the practice route mounts.
