import { db } from '@/database/models/db';
import { DatabaseError } from '@/types/error.types';
import type { GrammarType } from '@/types/generic.types';
import { TableName } from '@/types/table.types';
import Dexie from 'dexie';
import UserItem from './user-items';
import SyncEntityModel from './sync-entity-model';

export default class Grammar extends SyncEntityModel implements GrammarType {
  id!: number;
  name!: string;
  note!: string;
  sort_order!: number;
  deleted_at!: string | null;

  static override readonly syncTable = db.grammar as Dexie.Table<GrammarType, number>;
  static override readonly syncTableName = TableName.Grammar;
  static override readonly syncEntityName = 'grammar';
  static override readonly syncSelect = 'id, name, note, sort_order, deleted_at';

  /**
   * Reads one local grammar record by id.
   *
   * @param grammarId Grammar id referenced by a user item or block.
   * @returns The matching grammar record.
   * @throws DatabaseError when the grammar id is missing locally.
   */
  static async getById(grammarId: number): Promise<GrammarType> {
    const grammar = await db.grammar.get(grammarId);

    if (!grammar) {
      throw new DatabaseError(`Grammar with ID ${grammarId} not found.`, undefined, { grammarId });
    }

    return grammar;
  }

  /**
   * Reads grammar topics started by a user.
   *
   * @param userId User id whose started grammar ids should be inspected.
   * @returns Started grammar records sorted by sort_order, or [] when the user has none.
   */
  static async getStarted(userId: string): Promise<GrammarType[]> {
    const grammarIds = await UserItem.getStartedGrammarIds(userId);

    if (grammarIds.length === 0) return [];

    return await db.grammar.where('id').anyOf(grammarIds).sortBy('sort_order');
  }
}
