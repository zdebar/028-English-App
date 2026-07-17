import config from '@/config/config';
import Dexie, { type EntityTable } from 'dexie';
import type Grammar from '@/database/models/grammar';
import type AudioRecord from '@/database/models/audio-records';
import type UserItem from '@/database/models/user-items';
import type UserScore from '@/database/models/user-scores';
import type UserBlock from '@/database/models/user-blocks';
import type AudioMetadata from '@/database/models/audio-metadata';
import type Metadata from '@/database/models/metadata';
import type Lessons from '@/database/models/lessons';
import type Levels from '@/database/models/levels';
import type Notes from '@/database/models/notes';

const USER_ITEMS_SCHEMA_V1 =
  '[user_id+item_id], [user_id+grammar_id+started_at], [user_id+is_vocabulary+started_at], [user_id+is_practice_item+is_vocabulary+started_at], [user_id+started_at], [user_id+updated_at], [user_id+next_at+sort_order], [user_id+next_at+mastered_at+sort_order], [user_id+is_vocabulary+next_at+mastered_at+sort_order], [user_id+is_practice_item+is_vocabulary+next_at+mastered_at+sort_order], [user_id+lesson_id+is_vocabulary+started_at], [user_id+lesson_id+is_practice_item+is_vocabulary+started_at], [user_id+block_id]';
const USER_ITEMS_SCHEMA_V2 = `${USER_ITEMS_SCHEMA_V1}, [user_id+is_practice_item+is_vocabulary+next_at+mastered_at+curriculum_sort_path]`;

/**
 * Application IndexedDB wrapper built on Dexie.
 *
 * Declares the concrete tables used by the app and their schema.
 * Each table maps to a model class under `database/models` and is exposed
 * as an `EntityTable` for typed access throughout the frontend code.
 */
export default class AppDB extends Dexie {
  levels!: EntityTable<Levels, 'id'>;
  lessons!: EntityTable<Lessons, 'id'>;
  notes!: EntityTable<Notes, 'id'>;
  grammar!: EntityTable<Grammar, 'id'>;
  user_items!: EntityTable<UserItem, any>;
  user_scores!: EntityTable<UserScore, any>;
  user_blocks!: EntityTable<UserBlock, any>;
  audio_records!: EntityTable<AudioRecord, 'filename'>;
  audio_metadata!: EntityTable<AudioMetadata, 'archive_name'>;
  metadata!: EntityTable<Metadata, any>;

  constructor() {
    super(config.database.dbName);

    // Define the database schema
    this.version(1).stores({
      levels: 'id, sort_order',
      lessons: 'id, sort_order',
      notes: 'id',
      grammar: 'id, sort_order',
      user_items: USER_ITEMS_SCHEMA_V1,
      user_blocks:
        '[user_id+block_id], user_id, [user_id+updated_at], [user_id+sort_order], [user_id+is_vocabulary+started_at+sort_order], [user_id+is_vocabulary+started_at+mastered_at+sort_order]',
      user_scores: '[user_id+date], [user_id+updated_at]',
      audio_records: 'filename',
      audio_metadata: 'archive_name',
      metadata: '[table_name+user_id]',
    });

    this.version(2)
      .stores({
        user_items: USER_ITEMS_SCHEMA_V2,
      })
      .upgrade(async (transaction) => {
        const [levels, lessons, blocks, items] = await Promise.all([
          transaction.table('levels').toArray(),
          transaction.table('lessons').toArray(),
          transaction.table('user_blocks').toArray(),
          transaction.table('user_items').toArray(),
        ]);
        const levelById = new Map(levels.map((level) => [level.id, level]));
        const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]));
        const blockByUserAndId = new Map(
          blocks.map((block) => [`${block.user_id}:${block.block_id}`, block]),
        );
        const updatedItems = items.filter((item) => {
          const block = blockByUserAndId.get(`${item.user_id}:${item.block_id}`);
          const lesson = block == null ? undefined : lessonById.get(block.lesson_id);
          const level = lesson == null ? undefined : levelById.get(lesson.level_id);
          if (block == null || lesson == null || level == null) return false;

          item.curriculum_sort_path = [
            level.sort_order,
            lesson.sort_order,
            block.sort_order,
            item.sort_order,
          ];
          return true;
        });

        if (updatedItems.length > 0) {
          await transaction.table('user_items').bulkPut(updatedItems);
        }
      });
  }
}
