import { Entity } from 'dexie';
import type AppDB from '@/database/models/app-db';
import type { GrammarLocal } from '@/types/local.types';
import { supabaseInstance } from '@/config/supabase.config';
import { db } from '@/database/models/db';
import config from '@/config/config';
import Dexie from 'dexie';
import Metadata from './metadata';
import { TableName } from '@/types/local.types';
import { DatabaseError, SupabaseError } from '@/types/error.types';
import { infoHandler } from '@/features/logging/info-handler';
import { assertIsoDateString, assertPositiveInteger } from '@/utils/assertions.utils';
import { splitDeleted } from '../utils/data-sync.utils';

const NULL_DATE = config.database.nullReplacementDate;

/**
 * Represents a grammar entity in the application database.
 * - grammar records are shared across all users
 *
 * @method getGrammarById - Fetches a grammar record by its ID.
 * @method getStartedGrammarIds - Retrieves the list of unique grammar IDs that the user has started.
 * @method getStartedGrammarList - Retrieves the list of grammar that the user has started.
 * @method syncGrammar - Synchronizes grammar data between the local database and Supabase, either fully or incrementally based on the last sync timestamp.
 *
 */
export default class Grammar extends Entity<AppDB> implements GrammarLocal {
  id!: number;
  name!: string;
  note!: string;
  sort_order!: number;
  deleted_at!: string | null;

  /**
   * Retrieves a grammar record by its ID from the database.
   *
   * @param grammarId - The unique identifier of the grammar record to retrieve.
   * @returns A promise that resolves to the grammar record.
   * @throws {DatabaseError} If no grammar record with the specified ID is found.
   */
  static async getGrammarById(grammarId: number): Promise<GrammarLocal> {
    assertPositiveInteger(grammarId, 'grammarId');

    const grammar = await db.grammar.get(grammarId);

    if (!grammar) {
      throw new DatabaseError(`Grammar with ID ${grammarId} not found.`, undefined, { grammarId });
    }

    return grammar;
  }

  /**
   * Retrieves a list of unique grammar IDs for items that have been started by a user.
   *
   * @param userId - The ID of the user
   * @returns A promise that resolves to an array of unique grammar IDs that the user has started, or an empty array if no items have been started
   */
  static async getStartedGrammarIds(userId: string): Promise<number[]> {
    if (!userId) throw new Error('userId is required in getStartedGrammarIds');

    const startedGrammarIds = await db.user_items
      .where('[user_id+grammar_id+started_at]')
      .between([userId, Dexie.minKey, Dexie.minKey], [userId, Dexie.maxKey, NULL_DATE], true, false)
      .primaryKeys();

    return [...new Set(startedGrammarIds.map((key) => key[1]))];
  }

  /**
   * Retrieves a list of grammar items that have been started by the user.
   *
   * Fetches all grammar records associated with user items that have a non-null `started_at` timestamp,
   * indicating that the user has begun studying those grammar topics.
   *
   * @param userId - The unique identifier of the user
   * @returns A promise that resolves to an array of started grammar items with progress information. Returns an empty array
   *          if the user has not started any grammar items or if no matching grammar records are found.
   */
  static async getStartedGrammarList(userId: string): Promise<GrammarLocal[]> {
    if (!userId) throw new Error('userId is required in getStartedGrammarList');

    // Get unique grammar IDs for started items
    const grammarIds = await this.getStartedGrammarIds(userId);
    if (grammarIds.length === 0) return [];

    return await db.grammar.where('id').anyOf(grammarIds).toArray();
  }

  /**
   * Synchronizes grammar data between the local database and Supabase.
   *
   * @param doFullSync - If true, performs a full sync by clearing all existing grammar data
   *                     and fetching everything from the epoch start date. If false, performs
   *                     an incremental sync based on the last sync timestamp. Defaults to false.
   * @returns A promise that resolves when the sync operation is complete.
   */
  static async syncGrammar(doFullSync: boolean = false): Promise<void> {
    // Step 1: Determine the last sync timestamp and the new sync timestamp
    const lastSyncedAt = doFullSync
      ? config.database.epochStartDate
      : await Metadata.getSyncedAt(TableName.Grammar);
    const newSyncedAt = new Date().toISOString();

    // Step 2: Fetch updated grammar records from Supabase based on the last sync timestamp
    const grammar = await this.fetchFromRemote(lastSyncedAt);
    const { toUpsert, toDelete } = splitDeleted(grammar);

    // Step 3: Update the local database within a transaction to ensure data integrity
    await db.transaction('rw', db.grammar, db.metadata, async () => {
      if (doFullSync) {
        await db.grammar.clear();
      } else if (toDelete.length > 0) {
        await db.grammar.bulkDelete(toDelete.map((item) => item.id));
      }
      if (toUpsert.length > 0) {
        await db.grammar.bulkPut(toUpsert);
      }
      await Metadata.markAsSynced(TableName.Grammar, newSyncedAt);
    });

    infoHandler(`Completed ${grammar.length} grammars pull from Supabase.`);
  }

  /**
   * Fetches grammar records from Supabase that were updated within a specified time range.
   *
   * @param lastSyncedAt - The start of the time range (inclusive). Defaults to the null replacement date from config.
   * @param newSyncedAt - The end of the time range (exclusive).
   * @returns A promise that resolves to an array of grammar records. Returns an empty array if no records are found.
   * @throws SupabaseError if the Supabase query fails.
   */
  private static async fetchFromRemote(
    lastSyncedAt: string = config.database.epochStartDate,
  ): Promise<GrammarLocal[]> {
    assertIsoDateString(lastSyncedAt);

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
