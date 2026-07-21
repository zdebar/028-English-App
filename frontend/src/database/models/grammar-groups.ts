import { db } from '@/database/models/db';
import type { GrammarChunkType, GrammarGroupType } from '@/types/generic.types';
import { TableName } from '@/types/table.types';
import Dexie from 'dexie';
import GrammarChunk from './grammar-chunks';
import SyncEntityModel from './sync-entity-model';
import UserItem from './user-items';

export type GrammarGroupWithChunks = GrammarGroupType & { chunks: GrammarChunkType[] };

export default class GrammarGroup extends SyncEntityModel implements GrammarGroupType {
  id!: number;
  name!: string;
  note!: string | null;
  sort_order!: number;
  deleted_at!: string | null;

  static override readonly syncTable = db.grammar_groups as Dexie.Table<GrammarGroupType, number>;
  static override readonly syncTableName = TableName.GrammarGroups;
  static override readonly syncEntityName = 'grammar groups';
  static override readonly syncSelect = 'id, name, note, sort_order, deleted_at';

  static async getStarted(userId: string): Promise<GrammarGroupWithChunks[]> {
    const chunkIds = await UserItem.getStartedGrammarChunkIds(userId);
    if (chunkIds.length === 0) return [];

    const startedChunks = await db.grammar_chunks.where('id').anyOf(chunkIds).toArray();
    const groupIds = [
      ...new Set(
        startedChunks
          .map((chunk) => chunk.grammar_group_id)
          .filter((id): id is number => typeof id === 'number'),
      ),
    ];
    if (groupIds.length === 0) return [];

    const groups = await db.grammar_groups.where('id').anyOf(groupIds).sortBy('sort_order');
    return Promise.all(
      groups.map(async (group) => ({
        ...group,
        chunks: await GrammarChunk.getByGroupId(group.id),
      })),
    );
  }
}
