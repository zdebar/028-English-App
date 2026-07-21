import { db } from '@/database/models/db';
import type { GrammarChunkType, GrammarGroupType } from '@/types/generic.types';
import { TableName } from '@/types/table.types';
import Dexie from 'dexie';
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
    const chunksByGroupId = new Map<number, GrammarChunkType[]>();

    for (const chunk of startedChunks) {
      if (chunk.grammar_group_id == null) continue;
      const groupChunks = chunksByGroupId.get(chunk.grammar_group_id) ?? [];
      groupChunks.push(chunk);
      chunksByGroupId.set(chunk.grammar_group_id, groupChunks);
    }

    if (chunksByGroupId.size === 0) return [];

    const groups = await db.grammar_groups
      .where('id')
      .anyOf([...chunksByGroupId.keys()])
      .sortBy('sort_order');

    return groups.map((group) => ({
      ...group,
      chunks: (chunksByGroupId.get(group.id) ?? []).sort(
        (left, right) => left.sort_order - right.sort_order,
      ),
    }));
  }
}
