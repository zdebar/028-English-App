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
      blocks: 'id, sort_order',
      notes: 'id',
      grammar: 'id, sort_order',
      user_items:
        '[user_id+item_id], [user_id+grammar_id+started_at], [user_id+is_vocabulary+started_at+is_study_item], [user_id+started_at], [user_id+updated_at], [user_id+next_at+sort_order], [user_id+next_at+mastered_at+sort_order+is_study_item], [user_id+block_id]',
      user_scores: '[user_id+date], [user_id+updated_at]',
      audio_records: 'filename',
      audio_metadata: 'archive_name',
      metadata: '[table_name+user_id]',
    });

    this.version(2).stores({
      blocks: null,
      user_items:
        '[user_id+item_id], [user_id+grammar_id+started_at], [user_id+is_vocabulary+started_at+is_study_item], [user_id+started_at], [user_id+updated_at], [user_id+next_at+sort_order], [user_id+next_at+mastered_at+sort_order+is_study_item], [user_id+is_vocabulary+next_at+mastered_at+sort_order+is_study_item], [user_id+lesson_id+is_vocabulary+started_at], [user_id+block_id]',
      user_blocks:
        '[user_id+block_id], user_id, [user_id+updated_at], [user_id+sort_order], [user_id+is_vocabulary+started_at+sort_order], [user_id+is_vocabulary+started_at+mastered_at+sort_order]',
    });
  }
}
