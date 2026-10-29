# Domain Models

Supabase stores shared content and user data. The frontend mirrors the records it
needs in Dexie IndexedDB, where its model classes support local reads, writes, and
synchronization.

## Current Supabase Tables

| Schema | Tables | Role |
| --- | --- | --- |
| `public` shared content | `levels`, `lessons`, `items`, `notes` | Ordered course content, practice items, and supporting notes. |
| `public` group catalog | `groups`, `group_items`, `group_relations` | Topics, grammar, sounds, pronunciation groups, their item examples, and relationships. |
| `public` user data | `users`, `user_lessons`, `user_items` | User settings, lesson starts, and per-item progress. |
| `private` | `private.settings` | Operational settings used by database functions. |

The active schema is defined in `supabase/schemas/00_tables.sql`. Older names such
as `blocks`, `topics`, `grammar_chunks`, and `user_scores` belong to historical
migrations or local Dexie upgrades; they are not current application tables.

## Relationships

| Entity | Relationship |
| --- | --- |
| `levels` → `lessons` → `items` | Lessons are ordered within levels; items are ordered within lessons. |
| `items` → `notes` | An item can reference an optional note through `note_id`. |
| `lessons` → `groups` | Optional `lessons.group_id` links a lesson to its grammar detail group. |
| `groups` ↔ `items` | `group_items` links a group to ordered example items. |
| `groups` ↔ `groups` | `group_relations` records `hierarchy`, `detail`, and `contrast` relationships. |
| `user_items` | One progress row per user and item, keyed by `(user_id, item_id)`. |
| `user_lessons` | Records a user's lesson starts with `started_at`; a user may have start records for different dates. |

`groups.type` is `topic`, `grammar`, `sound`, or `pronunciation`. Sound groups also
carry a sound class/category. The grammar, topic, sound, and pronunciation query
helpers in `frontend/src/database/models` read this unified group model; their
names do not imply separate current Supabase tables.

## Progress And Sync Fields

The server's `user_items` table stores progress and scheduling. Sync RPCs combine
those rows with item content for the local `UserItem` model.

| Field | Meaning |
| --- | --- |
| `progress_cz_to_en`, `progress_en_to_cz` | Spaced-repetition progress for each review direction. |
| `is_cz_to_en_enabled`, `is_en_to_cz_enabled` | Whether an item is enabled in each direction. |
| `next_at_cz_to_en`, `next_at_en_to_cz` | Next scheduled review for each direction. |
| `mastered_at_cz_to_en`, `mastered_at_en_to_cz` | Mastery timestamps for each direction. |
| `started_at` | First practice start for an item, or the start time for a `user_lessons` record. |
| `updated_at` | Change timestamp used by synchronization. |
| `deleted_at` | Soft-delete marker for shared catalog content. User accounts are hard-deleted. |

For IndexedDB compound indexes, null dates use
`config.database.nullReplacementDate`. Sync converts the local sentinel back to
null where the remote field is nullable. `items.is_vocabulary` separates
vocabulary from grammar practice.

An item is considered initiated when it has a `started_at` value or has been
skipped during initial training (its Czech-to-English direction is marked
mastered). Lesson-start state in the Home dashboard comes from `user_lessons`.

## Frontend Models

| Model | Responsibility |
| --- | --- |
| `Levels`, `Lessons`, `Notes`, `Groups`, `GroupItem`, `GroupRelation` | Read and synchronize shared catalog data. |
| `UserItem` | Local user progress, review selection, initial-training selection, resets, and item sync. |
| `UserLesson` | Record and synchronize lesson starts; enforce the daily new-lesson limit. |
| `UserSettings` | Read and synchronize `users.max_new_lessons_per_day`. |
| `AudioRecord`, `AudioMetadata` | Track local audio records and archive metadata. |
| `Metadata` | Store local per-table, per-user sync metadata. |
| `Topic`, `GrammarTopic`, `GrammarGroup`, `GrammarChunk`, `SoundGroup`, `PronunciationGroup` | Feature query helpers backed by the unified group tables. |

## Active IndexedDB Tables And Indexes

The current Dexie schema is version 13 in
`frontend/src/database/models/app-db.ts`. Its active tables are `levels`,
`lessons`, `notes`, `user_items`, `user_lessons`, `users`, `groups`,
`group_items`, `group_relations`, `audio_records`, `audio_metadata`, and
`metadata`. Upgrades remove legacy block, topic, grammar, pronunciation, score,
history, and practice-session stores.

Key indexes on `user_items`:

| Index | Used for |
| --- | --- |
| `[user_id+item_id]` | Direct user-item lookup, update, and reset. |
| `[user_id+is_vocabulary+started_at]` | Started vocabulary lookup. |
| `[user_id+started_at]` | User items ordered/filterable by start state. |
| `[user_id+updated_at]` | Incremental sync windows. |
| `[user_id+lesson_id+is_vocabulary+started_at]` | Lesson/type-specific selection. |
| `[user_id+next_at_cz_to_en+mastered_at_cz_to_en+curriculum_sort_path]` | Czech-to-English review selection and order. |
| `[user_id+next_at_en_to_cz+mastered_at_en_to_cz+curriculum_sort_path]` | English-to-Czech review selection and order. |

`user_lessons` uses `[user_id+lesson_id+started_at]` and
`[user_id+started_at]` to check lesson continuation and daily starts.
