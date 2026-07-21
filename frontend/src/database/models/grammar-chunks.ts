import { db } from '@/database/models/db';
import { DatabaseError } from '@/types/error.types';
import type { GrammarChunkType } from '@/types/generic.types';
import { TableName } from '@/types/table.types';
import Dexie from 'dexie';
import SyncEntityModel from './sync-entity-model';
import UserItem from './user-items';

export default class GrammarChunk extends SyncEntityModel implements GrammarChunkType {
  id!: number;
  name!: string;
  note!: string | null;
  grammar_group_id!: number | null;
  sort_order!: number;
  deleted_at!: string | null;

  static override readonly syncTable = db.grammar_chunks as Dexie.Table<GrammarChunkType, number>;
  static override readonly syncTableName = TableName.GrammarChunks;
  static override readonly syncEntityName = 'grammar chunks';
  static override readonly syncSelect =
    'id, name, note, grammar_group_id, sort_order, deleted_at';

  static async getById(grammarChunkId: number): Promise<GrammarChunkType> {
    const chunk = await db.grammar_chunks.get(grammarChunkId);
    if (!chunk) {
      throw new DatabaseError(`Grammar chunk with ID ${grammarChunkId} not found.`, undefined, {
        grammarChunkId,
      });
    }
    return chunk;
  }

  static async getByGroupId(grammarGroupId: number): Promise<GrammarChunkType[]> {
    return db.grammar_chunks
      .where('grammar_group_id')
      .equals(grammarGroupId)
      .sortBy('sort_order');
  }

  static async getStarted(userId: string): Promise<GrammarChunkType[]> {
    const chunkIds = await UserItem.getStartedGrammarChunkIds(userId);
    if (chunkIds.length === 0) return [];
    return db.grammar_chunks.where('id').anyOf(chunkIds).sortBy('sort_order');
  }
}
