import { db } from '@/database/models/db';
import type { GrammarChunkType, GrammarGroupType } from '@/types/generic.types';
import { TableName } from '@/types/table.types';
import Dexie from 'dexie';
import SyncEntityModel from './sync-entity-model';
import UserItem from './user-items';

export type GrammarGroupWithChunks = GrammarGroupType & {
  chunks: GrammarChunkType[];
  standalone_chunk_id?: number;
};

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
    const standaloneChunks: GrammarGroupWithChunks[] = [];

    for (const chunk of startedChunks) {
      if (chunk.grammar_group_id == null) {
        const { grammar_group_id: _grammarGroupId, ...standaloneChunk } = chunk;
        standaloneChunks.push({
          ...standaloneChunk,
          chunks: [],
          standalone_chunk_id: chunk.id,
        });
        continue;
      }
      const groupChunks = chunksByGroupId.get(chunk.grammar_group_id) ?? [];
      groupChunks.push(chunk);
      chunksByGroupId.set(chunk.grammar_group_id, groupChunks);
    }

    const groups =
      chunksByGroupId.size === 0
        ? []
        : await db.grammar_groups
            .where('id')
            .anyOf([...chunksByGroupId.keys()])
            .sortBy('sort_order');

    return [
      ...groups.map((group) => ({
        ...group,
        chunks: (chunksByGroupId.get(group.id) ?? []).sort(
          (left, right) => left.sort_order - right.sort_order,
        ),
      })),
      ...standaloneChunks,
    ].sort((left, right) => left.sort_order - right.sort_order);
  }
}
