# Domain Models

The frontend stores shared content and per-user progress in IndexedDB through
Dexie models under `frontend/src/database/models`.

## Core Progress Fields

| Field | Meaning |
| --- | --- |
| Directional progress | Numeric SRS level. Correct answers increment it, incorrect answers reset it, and skips preserve it while mastering the direction. |
| `progress_history` | Array of progress snapshots with direction and explicit `correct`, `incorrect`, `skip`, or legacy outcome. |
| `started_at` | First time the user started an item. Null is represented by config's null replacement date. |
| `next_at` | When the item is next ready. Null replacement date means not scheduled/not started depending on context. |
| `mastered_at` | Completion/mastery timestamp. Null replacement date means not mastered. |
| `deleted_at` | Soft-delete timestamp. Null replacement date means not deleted. |
| Null replacement date/number | IndexedDB index-friendly stand-ins from `config.database`. |

## Main Relationships

| Entity | Relationship |
| --- | --- |
| `levels` | Contain lessons and support dashboard/overview grouping. |
| `lessons` | Own ordered items and explicit blocks. |
| `blocks` | Optional explicit initial-training groups; progress remains item-based. |
| `topics` | Shared overview groups linked independently through nullable `items.topic_id`; one topic may span multiple practice blocks. |
| `items` / `user_items` | Individual vocabulary or grammar practice units. User items track progress and scheduling. |
| `grammar_groups` / `grammar_chunks` | Overview pages group ordered chunks; blocks and practice items link to one relevant hint through `grammar_chunk_id`. |
| `grammar_chunk_examples` | Curated, ordered item examples displayed with a grammar chunk independently of block membership and item hint linkage. |
| `notes` | Shared note/detail content, linked by `note_id`. |
| `user_scores` | Per-user daily practice count. |

Vocabulary items have `is_vocabulary = 1`. Grammar items have `is_vocabulary = 0`. The flag
and `grammar_chunk_id` are independent item fields. Items own `lesson_id`; `block_id` is optional.
The curriculum path contains level, lesson, and item order.

## Important Model Responsibilities

| Model | Responsibility |
| --- | --- |
| `UserItem` | Practice deck creation, item progress saves, vocabulary readiness, item resets, user item sync. |
| `Block` | Shared metadata for explicit initial-training groups. |
| `Topic` | Shared topic metadata sync and started-topic discovery. |
| `UserScore` | Daily practice count creation, incrementing, and sync. |
| `Levels` | Dashboard/overview progress aggregation. |

## Feature Readers And Writers

| Model | Main readers | Main writers |
| --- | --- | --- |
| `UserItem` | Home readiness, practice decks, vocabulary overview, explicit block items, grammar overview | Practice progress, initial-training completion, item/block/grammar/vocabulary resets, sync. |
| `UserScore` | Home daily count, practice overview, dashboard stars | Practice progress actions, sync. |
| `Levels` / `Lessons` | Dashboard, levels overview, block/lesson grouping | Shared content sync. |
| `GrammarGroup` / `GrammarChunk` / `Notes` | Grouped grammar overview and chunk-level practice details | Shared content sync. |
| `AudioRecord` / `AudioMetadata` | Practice audio controls and audio manager | Audio archive sync and orphan cleanup. |

## Key IndexedDB Indexes

Declared in `frontend/src/database/models/app-db.ts`.

| Index | Used for |
| --- | --- |
| `[user_id+item_id]` | Direct user item lookup/reset/update. |
| `[user_id+block_id]` | Block item loading and block reset operations. |
| `[user_id+topic_id]` | Started topic detail loading and topic reset operations. |
| `[user_id+grammar_chunk_id+started_at]` | Grammar-chunk started-item queries and resets. |
| `[user_id+is_vocabulary+started_at]` | Started vocabulary queries. |
| `[user_id+started_at]` | Started-item and grammar discovery. |
| `[user_id+updated_at]` | Incremental sync push windows. |
| `[user_id+next_at+mastered_at+curriculum_sort_path]` | Unified practice deck and readiness queries. |

## Readiness Meaning

| Practice type | Ready item condition |
| --- | --- |
| Vocabulary | Not mastered and either `next_at < now` or `next_at` equals the null replacement date. |
| Grammar review | Not mastered, already started/scheduled, and `next_at < now`. |
| Initial training | First unstarted curriculum item starts an automatic lesson/type batch or its explicit block. |

Readiness is a UI availability concept. Actual practice deck creation still
queries the model again when the practice route mounts.
