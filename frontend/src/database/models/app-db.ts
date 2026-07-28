import config from '@/config/config';
import Dexie, { type EntityTable } from 'dexie';
import type GrammarChunk from '@/database/models/grammar-chunks';
import type GrammarGroup from '@/database/models/grammar-groups';
import type AudioRecord from '@/database/models/audio-records';
import type UserItem from '@/database/models/user-items';
import type UserScore from '@/database/models/user-scores';
import type UserBlock from '@/database/models/user-blocks';
import type AudioMetadata from '@/database/models/audio-metadata';
import type Metadata from '@/database/models/metadata';
import type Lessons from '@/database/models/lessons';
import type Levels from '@/database/models/levels';
import type Notes from '@/database/models/notes';

const LEGACY_USER_ITEMS_SCHEMA =
  '[user_id+item_id], [user_id+grammar_chunk_id+started_at], [user_id+is_vocabulary+started_at], [user_id+is_practice_item+is_vocabulary+started_at], [user_id+started_at], [user_id+updated_at], [user_id+next_at+sort_order], [user_id+next_at+mastered_at+sort_order], [user_id+is_vocabulary+next_at+mastered_at+sort_order], [user_id+is_practice_item+is_vocabulary+next_at+mastered_at+sort_order], [user_id+lesson_id+is_vocabulary+started_at], [user_id+lesson_id+is_practice_item+is_vocabulary+started_at], [user_id+block_id], [user_id+is_practice_item+next_at+mastered_at+curriculum_sort_path]';
const USER_ITEMS_SCHEMA =
  '[user_id+item_id], [user_id+grammar_chunk_id+started_at], [user_id+is_vocabulary+started_at], [user_id+is_practice_item+is_vocabulary+started_at], [user_id+started_at], [user_id+updated_at], [user_id+lesson_id+is_vocabulary+started_at], [user_id+lesson_id+is_practice_item+is_vocabulary+started_at], [user_id+block_id], [user_id+is_practice_item+next_at_cz_to_en+mastered_at_cz_to_en+curriculum_sort_path], [user_id+is_practice_item+next_at_en_to_cz+mastered_at_en_to_cz+curriculum_sort_path]';

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
  grammar_groups!: EntityTable<GrammarGroup, 'id'>;
  grammar_chunks!: EntityTable<GrammarChunk, 'id'>;
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
      grammar_groups: 'id, sort_order',
      grammar_chunks: 'id, grammar_group_id, sort_order',
      user_items: LEGACY_USER_ITEMS_SCHEMA,
      user_blocks:
        '[user_id+block_id], user_id, [user_id+updated_at]',
      user_scores: '[user_id+date], [user_id+updated_at]',
      audio_records: 'filename',
      audio_metadata: 'archive_name',
      metadata: '[table_name+user_id]',
    });

    this.version(2)
      .stores({
        user_items: USER_ITEMS_SCHEMA,
      })
      .upgrade(async (transaction) => {
        const nullDate = config.database.nullReplacementDate;
        await transaction
          .table('user_items')
          .toCollection()
          .modify((item) => {
            const migratedProgress = Math.floor((item.progress ?? 0) / 2);
            const oldNextAt = item.next_at ?? nullDate;
            const oldMasteredAt = item.mastered_at ?? nullDate;

            item.progress_cz_to_en = migratedProgress;
            item.progress_en_to_cz = migratedProgress;
            item.next_at_cz_to_en = oldNextAt;
            item.next_at_en_to_cz = oldNextAt;
            item.mastered_at_cz_to_en =
              oldMasteredAt !== nullDate &&
              migratedProgress >= config.srs.intervals.czToEn.length
                ? oldMasteredAt
                : nullDate;
            item.mastered_at_en_to_cz =
              oldMasteredAt !== nullDate &&
              migratedProgress >= config.srs.intervals.enToCz.length
                ? oldMasteredAt
                : nullDate;

            delete item.progress;
            delete item.next_at;
            delete item.mastered_at;
          });
      });
  }
}
