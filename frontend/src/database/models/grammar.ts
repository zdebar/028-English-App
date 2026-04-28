import config from '@/config/config';
import { supabaseInstance } from '@/config/supabase.config';
import type AppDB from '@/database/models/app-db';
import { db } from '@/database/models/db';
import { DatabaseError, SupabaseError } from '@/types/error.types';
import type { GrammarType } from '@/types/generic.types';
import { TableName } from '@/types/table.types';
import { assertNonEmptyString, assertPositiveInteger } from '@/utils/assertions.utils';
import Dexie, { Entity } from 'dexie';
import { syncFromRemoteGeneric } from '../utils/data-sync.utils';
import UserItem from './user-items';

/**
 * Represents a grammar entity in the application database.
 * - grammar records are shared across all users
 *
 * @method getById - Fetches a grammar record by its ID.
 * @method getStartedIds - Retrieves the list of unique grammar IDs that the user has started.
 * @method getStarted - Retrieves the list of grammar that the user has started.
 * @method syncFromRemote - Synchronizes grammar data between the local database and Supabase, either fully or incrementally based on the last sync timestamp.
 *
 */
export default class Grammar extends Entity<AppDB> implements GrammarType {
  id!: number;
  name!: string;
  note!: string;
  sort_order!: number;
  deleted_at!: string | null;

  /**
   * Retrieves a grammar record by its ID from the database.
   * @param grammarId - The unique identifier of the grammar record to retrieve.
   */
  static async getById(grammarId: number): Promise<GrammarType> {
    assertPositiveInteger(grammarId, 'grammarId');

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
    assertNonEmptyString(userId, 'userId');

    const grammarIds = await UserItem.getStartedGrammarIds(userId);
    if (grammarIds.length === 0) return [];
    return await db.grammar.where('id').anyOf(grammarIds).sortBy('sort_order');
  }

  /**
   * Retrieves unique grammar IDs started by the user.
   * Kept as an explicit model API for call sites/tests that need IDs only.
   */
  static async getStartedGrammarIds(userId: string): Promise<number[]> {
    assertNonEmptyString(userId, 'userId');
    return await UserItem.getStartedGrammarIds(userId);
  }

  /**
   * Synchronizes grammar data between the local database and Supabase.
   * @param doFullSync - If true, performs a full sync by clearing all existing grammar data
   *                     and fetching everything from the epoch start date. If false, performs
   *                     an incremental sync based on the last sync timestamp. Defaults to false.
   */
  static async syncFromRemote(doFullSync: boolean = false): Promise<void> {
    await syncFromRemoteGeneric<GrammarType>(
      db.grammar as Dexie.Table<GrammarType, number>,
      TableName.Grammar,
      this.fetchFromRemote,
      doFullSync,
    );
  }

  /**
   * Fetches grammar records from Supabase that were updated within a specified time range.
   * @param lastSyncedAt - The start of the time range (inclusive). Defaults to the null replacement date from config.
   */
  private static async fetchFromRemote(
    lastSyncedAt: string = config.database.epochStartDate,
  ): Promise<GrammarType[]> {
    const { data: grammar, error } = await supabaseInstance
      .from('grammar')
      .select('id, name, note, sort_order, deleted_at')
      .gte('updated_at', lastSyncedAt);

    if (error) {
      throw new SupabaseError(`Failed to fetch grammar data from supabase`, error, {
        lastSyncedAt,
      });
    }

    return grammar ?? [];
  }
}
