import config from '@/config/config';
import Dexie, { type EntityTable } from 'dexie';
import type Grammar from '@/database/models/grammar';
import type AudioRecord from '@/database/models/audio-records';
import type UserItem from '@/database/models/user-items';
import type UserScore from '@/database/models/user-scores';
import type AudioMetadata from '@/database/models/audio-metadata';
import type Metadata from '@/database/models/metadata';

export default class AppDB extends Dexie {
  user_items!: EntityTable<UserItem, any>;
  grammar!: EntityTable<Grammar, 'id'>;
  user_scores!: EntityTable<UserScore, any>;
  audio_records!: EntityTable<AudioRecord, 'filename'>;
  audio_metadata!: EntityTable<AudioMetadata, 'archive_name'>;
  metadata!: EntityTable<Metadata, any>;

  constructor() {
    super(config.database.dbName);

    // Define the database schema
    this.version(1).stores({
      user_items:
        '[user_id+item_id], [user_id+started_at], [user_id+grammar_id+started_at], [user_id+updated_at], [user_id+next_at+mastered_at+sequence]',
      grammar: 'id',
      user_scores: '[user_id+date], [user_id+updated_at]',
      audio_records: 'filename',
      audio_metadata: 'archive_name',
      metadata: '[table_name+user_id]',
    });
  }
}
