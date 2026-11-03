# Domain models

Supabase holds the remote curriculum and user data. Dexie mirrors the records needed by the frontend. The central data manager reads the active account's local records and builds page packages from them.

## Current Supabase tables

| Schema | Tables | Purpose |
| --- | --- | --- |
| public | levels, lessons, items, notes | Course structure, learning items, and supporting notes. |
| public | groups, group_items, group_relations | Topic, grammar, sound, and pronunciation groupings. |
| public | users, user_lessons, user_items | Account records, lesson starts, and per-item progress. |
| private | settings | Operational settings used by database functions. |

The current table definitions are in **supabase/schemas/00_tables.sql**. The old content tables such as blocks, topics, grammar chunks, and pronunciation groups are not current server tables.

## Content relationships

| Relationship | Meaning |
| --- | --- |
| levels → lessons → items | Lessons belong to levels; ordered items belong to lessons. |
| items → notes | An item can reference one optional note through note_id. |
| lessons → groups | Optional lessons.group_id links a lesson to its grammar context. |
| groups ↔ items | group_items assigns ordered example items to any supported group type. |
| groups ↔ groups | group_relations stores supported hierarchy, detail, or contrast relations. |

A group has one of four types: topic, grammar, sound, or pronunciation. Current relation rules allow grammar hierarchy/detail, topic hierarchy, and pronunciation-to-sound contrast. Sound groups carry a sound class and category.

Shared catalog tables use deleted_at timestamps as sync tombstones. User records have no soft-delete lifecycle; account deletion removes the user and their owned records.

## Progress and synchronization fields

Server user_items stores per-user progress; the sync RPC combines that progress with its item content for the local UserItem model. Local IndexedDB dates that participate in compound indexes use the configured null-replacement value; sync converts nullable remote values at the boundary.

| Field | Meaning |
| --- | --- |
| progress_cz_to_en, progress_en_to_cz | Spaced-repetition progress by answer direction. |
| is_cz_to_en_enabled, is_en_to_cz_enabled | Whether each answer direction is enabled. |
| next_at_cz_to_en, next_at_en_to_cz | Next scheduled review. |
| mastered_at_cz_to_en, mastered_at_en_to_cz | Mastery timestamp by direction. |
| started_at | Item start, or the start timestamp of a user_lessons row. |
| updated_at | Change timestamp used by incremental sync. |

## IndexedDB tables

The active Dexie schema is version 15 in **frontend/src/database/models/app-db.ts**.

| Local table | Purpose |
| --- | --- |
| levels, lessons, notes | Shared curriculum data. |
| groups, group_items, group_relations | Shared group catalog and links. |
| user_items | User progress joined with the item fields required by the app. |
| user_lessons | User lesson-start records. |
| audio_records, audio_metadata | Audio blobs and archive metadata, separate from the data manager. |
| metadata | Per-table and per-user incremental-sync cursors. |

There is no standalone IndexedDB items table. The application-facing UserItem rows contain the content and progress fields needed for practice. The data manager mirrors the curriculum, user_items, and user_lessons tables; it does not mirror metadata or audio blobs.

The active user_items indexes cover the user/item key, vocabulary and lesson selection, start and update times, and review scheduling by direction. user_lessons is keyed by user, lesson, and start time. The exact Dexie index definitions and historical upgrades are in app-db.ts.

## Frontend database folders

- **database/models/** — Dexie schema, table models, and model-owned database operations.
- **database/practice/** — practice selection, scheduling, and progress rules.
- **database/sync/** — remote sync orchestration and shared sync helpers.
- **database/state/** — data-manager types, selectors, and page-package builders.
- **database/audio/** — remote audio storage access.

For content authoring rules, see [DATA_GUIDE.md](../DATA_GUIDE.md).
