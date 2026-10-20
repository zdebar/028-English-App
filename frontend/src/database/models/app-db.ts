import config from '@/config/config';
import Dexie, { type EntityTable } from 'dexie';
import type GrammarChunk from '@/database/models/grammar-chunks';
import type GrammarGroup from '@/database/models/grammar-groups';
import type GrammarTopic from '@/database/models/grammar-topics';
import type AudioRecord from '@/database/models/audio-records';
import type UserItem from '@/database/models/user-items';
import type AudioMetadata from '@/database/models/audio-metadata';
import type Metadata from '@/database/models/metadata';
import type Lessons from '@/database/models/lessons';
import type Levels from '@/database/models/levels';
import type Notes from '@/database/models/notes';
import type PronunciationGroup from '@/database/models/pronunciation-groups';
import type PronunciationGroupItem from '@/database/models/pronunciation-group-items';
import type GrammarChunkExample from '@/database/models/grammar-chunk-examples';
import type Topic from '@/database/models/topics';
import type UserLesson from '@/database/models/user-lessons';
import type UserSettings from '@/database/models/user-settings';
import type { GroupType, GroupItemType, GroupRelationType } from '@/types/table.types';

const USER_ITEMS_SCHEMA =
  '[user_id+item_id], [user_id+grammar_chunk_id+started_at], [user_id+is_vocabulary+started_at], [user_id+started_at], [user_id+updated_at], [user_id+lesson_id+is_vocabulary+started_at], [user_id+block_id], [user_id+topic_id], [user_id+next_at_cz_to_en+mastered_at_cz_to_en+curriculum_sort_path], [user_id+next_at_en_to_cz+mastered_at_en_to_cz+curriculum_sort_path]';
const USER_ITEMS_SCHEMA_WITHOUT_BLOCK =
  '[user_id+item_id], [user_id+grammar_chunk_id+started_at], [user_id+is_vocabulary+started_at], [user_id+started_at], [user_id+updated_at], [user_id+lesson_id+is_vocabulary+started_at], [user_id+topic_id], [user_id+next_at_cz_to_en+mastered_at_cz_to_en+curriculum_sort_path], [user_id+next_at_en_to_cz+mastered_at_en_to_cz+curriculum_sort_path]';

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
  pronunciation_groups!: EntityTable<PronunciationGroup, 'id'>;
  pronunciation_group_items!: EntityTable<PronunciationGroupItem, any>;
  grammar_groups!: EntityTable<GrammarGroup, 'id'>;
  grammar_topics!: EntityTable<GrammarTopic, 'id'>;
  grammar_chunks!: EntityTable<GrammarChunk, 'id'>;
  grammar_chunk_examples!: EntityTable<GrammarChunkExample, any>;
  user_items!: EntityTable<UserItem, any>;
  audio_records!: EntityTable<AudioRecord, 'filename'>;
  audio_metadata!: EntityTable<AudioMetadata, 'archive_name'>;
  metadata!: EntityTable<Metadata, any>;
  topics!: EntityTable<Topic, 'id'>;
  user_lessons!: EntityTable<UserLesson, any>;
  users!: EntityTable<UserSettings, 'id'>;
  groups!: EntityTable<GroupType, 'id'>;
  group_items!: EntityTable<GroupItemType, 'id'>;
  group_relations!: EntityTable<GroupRelationType, 'id'>;

  constructor() {
    super(config.database.dbName);

    this.version(1).stores({
      levels: 'id, sort_order',
      lessons: 'id, sort_order',
      blocks: 'id, lesson_id, grammar_chunk_id',
      notes: 'id',
      topics: 'id, sort_order',
      pronunciation_groups: 'id, sort_order',
      pronunciation_group_items:
        '[pronunciation_group_id+item_id], [pronunciation_group_id+sort_order], [pronunciation_group_id+contrast_set+sort_order], item_id',
      grammar_groups: 'id, sort_order',
      grammar_chunks: 'id, grammar_group_id, sort_order',
      grammar_chunk_examples: '[grammar_chunk_id+item_id], [grammar_chunk_id+sort_order], item_id',
      user_items: USER_ITEMS_SCHEMA,
      user_item_progress_history:
        '[user_id+date+item_id+direction], [user_id+date], [user_id+updated_at], [user_id+item_id+direction]',
      practice_sessions: 'user_id, mode, updated_at',
      audio_records: 'filename',
      audio_metadata: 'archive_name',
      metadata: '[table_name+user_id]',
    });

    this.version(2).stores({
      user_scores: null,
      user_items_history: null,
      user_item_progress_history:
        '[user_id+date+item_id+direction], [user_id+date], [user_id+updated_at], [user_id+item_id+direction]',
    });

    this.version(3)
      .stores({ user_item_progress_history: null })
      .upgrade(async (transaction) => {
        await transaction
          .table('metadata')
          .where('[table_name+user_id]')
          .between(
            ['user_item_progress_history', Dexie.minKey],
            ['user_item_progress_history', Dexie.maxKey],
          )
          .delete();
      });
    this.version(4)
      .stores({ user_items: USER_ITEMS_SCHEMA })
      .upgrade(async (transaction) => {
        await transaction.table('user_items').toCollection().modify((item) => {
          delete (item as Record<string, unknown>).has_pronunciation_practice;
        });
      });

    this.version(5)
      .stores({ user_items: USER_ITEMS_SCHEMA })
      .upgrade(async (transaction) => {
        await transaction.table('user_items').toCollection().modify((item) => {
          const localItem = item as Record<string, unknown>;
          delete localItem['progress_' + 'en_to_cz'];
          delete localItem['next_at_' + 'en_to_cz'];
          delete localItem['mastered_at_' + 'en_to_cz'];
        });
      });
    this.version(6).stores({
      grammar_topics: 'id, sort_order',
      grammar_groups: 'id, grammar_topic_id, sort_order',
    });

    this.version(7)
      .stores({ user_items: USER_ITEMS_SCHEMA })
      .upgrade(async (transaction) => {
        await transaction.table('user_items').toCollection().modify((item) => {
          const localItem = item as Record<string, unknown>;
          localItem.czech_description ??= null;
        });
      });

    this.version(8)
      .stores({ user_items: USER_ITEMS_SCHEMA })
      .upgrade(async (transaction) => {
        await transaction.table('user_items').toCollection().modify((item) => {
          const localItem = item as Record<string, unknown>;
          localItem.progress_en_to_cz ??= 0;
          localItem.next_at_en_to_cz ??= config.database.nullReplacementDate;
          localItem.mastered_at_en_to_cz ??= config.database.nullReplacementDate;
          localItem.is_cz_to_en_enabled ??= true;
          localItem.is_en_to_cz_enabled ??= true;
        });
      });

    this.version(9).stores({
      user_lessons: '[user_id+lesson_id+started_at], [user_id+started_at]',
      users: 'id, updated_at',
    });

    this.version(10)
      .stores({
        blocks: null,
        user_items: USER_ITEMS_SCHEMA_WITHOUT_BLOCK,
      })
      .upgrade(async (transaction) => {
        await transaction.table('lessons').toCollection().modify((lesson) => {
          (lesson as Record<string, unknown>).grammar_chunk_id ??= null;
        });
        await transaction.table('user_items').toCollection().modify((item) => {
          delete (item as Record<string, unknown>).block_id;
        });
      });

    this.version(11).stores({ practice_sessions: null });

    this.version(12).stores({
      groups: 'id, type, sort_order, updated_at',
      group_items: 'id, &[group_id+item_id], group_id, item_id, [group_id+sort_order], updated_at',
      group_relations: 'id, &[parent_group_id+child_group_id], parent_group_id, child_group_id, [parent_group_id+relation_type+sort_order], updated_at',
      lessons: 'id, sort_order, group_id',
    }).upgrade(async (transaction) => {
      await transaction.table('lessons').toCollection().modify((lesson) => {
        (lesson as Record<string, unknown>).group_id ??= null;
      });
    });
  }
}
