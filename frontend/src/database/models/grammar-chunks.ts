import { db } from '@/database/models/db';
import { DatabaseError } from '@/types/error.types';
import type { GrammarChunkType } from '@/types/generic.types';
import { TableName } from '@/types/table.types';
import Dexie from 'dexie';
import SyncEntityModel from './sync-entity-model';
import UserItem from './user-items';
import type { UserItemLocal } from '@/types/user-item.types';

export type GrammarChunkWithExamples = GrammarChunkType & { items: UserItemLocal[] };

export default class GrammarChunk extends SyncEntityModel implements GrammarChunkType {
  id!: number;
  name!: string;
  note!: string | null;
  grammar_group_id!: number;
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

  static async getDetail(
    userId: string,
    grammarChunkId: number,
  ): Promise<GrammarChunkWithExamples> {
    const chunk = await this.getById(grammarChunkId);
    return this.addExamples(userId, chunk);
  }

  static async addExamples(
    userId: string,
    chunk: GrammarChunkType,
  ): Promise<GrammarChunkWithExamples> {
    const [chunkWithExamples] = await this.addExamplesToMany(userId, [chunk]);
    return chunkWithExamples ?? { ...chunk, items: [] };
  }

  static async addExamplesToMany(
    userId: string,
    chunks: readonly GrammarChunkType[],
  ): Promise<GrammarChunkWithExamples[]> {
    if (chunks.length === 0) return [];

    const chunkIds = new Set(chunks.map((chunk) => chunk.id));
    const memberships = await db.grammar_chunk_examples
      .filter((membership) => chunkIds.has(membership.grammar_chunk_id))
      .toArray();
    if (memberships.length === 0) {
      return chunks.map((chunk) => ({ ...chunk, items: [] }));
    }

    const itemIds = [...new Set(memberships.map((membership) => membership.item_id))];
    const items = await db.user_items
      .where('[user_id+item_id]')
      .anyOf(itemIds.map((itemId) => [userId, itemId]))
      .toArray();
    const itemById = new Map(items.map((item) => [item.item_id, item]));
    const membershipsByChunkId = new Map<number, typeof memberships>();

    for (const membership of memberships) {
      const chunkMemberships = membershipsByChunkId.get(membership.grammar_chunk_id) ?? [];
      chunkMemberships.push(membership);
      membershipsByChunkId.set(membership.grammar_chunk_id, chunkMemberships);
    }

    return chunks.map((chunk) => {
      const orderedMemberships = [...(membershipsByChunkId.get(chunk.id) ?? [])];
      orderedMemberships.sort((left, right) => left.sort_order - right.sort_order);

      return {
        ...chunk,
        items: orderedMemberships
          .map((membership) => itemById.get(membership.item_id))
          .filter((item): item is UserItem => Boolean(item)),
      };
    });
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
