import { db } from '@/database/models/db';
import { DatabaseError } from '@/types/error.types';
import type { GrammarType } from '@/types/generic.types';
import { TableName } from '@/types/table.types';
import Dexie from 'dexie';
import UserItem from './user-items';
import SyncEntityModel from './sync-entity-model';

/**
 * Represents a grammar entity in the application database.
 * - grammar records are shared across all users
 *
 * @method getById - Fetches a grammar record by its ID.
 * @method getStarted - Retrieves the list of grammar that the user has started.
 * @method syncFromRemote - Synchronizes grammar data between the local database and Supabase, either fully or incrementally based on the last sync timestamp.
 *
 */
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
   * Retrieves a grammar record by its ID from the database.
   * @param grammarId - The unique identifier of the grammar record to retrieve.
   */
  static async getById(grammarId: number): Promise<GrammarType> {
    const grammar = await db.grammar.get(grammarId);

    if (!grammar) {
      throw new DatabaseError(`Grammar with ID ${grammarId} not found.`, undefined, { grammarId });
    }

    return grammar;
  }

  /**
   * Retrieves a list of grammar items that have been started by the user.
   * @param userId - The unique identifier of the user
   */
  static async getStarted(userId: string): Promise<GrammarType[]> {
    const grammarIds = await UserItem.getStartedGrammarIds(userId);

    if (grammarIds.length === 0) return [];

    return await db.grammar.where('id').anyOf(grammarIds).sortBy('sort_order');
  }
}
