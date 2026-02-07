import { Entity } from 'dexie';
import type AppDB from '@/database/models/app-db';
import type { GrammarLocal, UserItemLocal } from '@/types/local.types';
import { supabaseInstance } from '@/config/supabase.config';
import { db } from '@/database/models/db';
import config from '@/config/config';
import Dexie from 'dexie';
import Metadata from './metadata';
import { TableName } from '@/types/local.types';

/**
 * Represents a grammar entity in the application database.
 * - grammar records are shared across all users
 *
 * @method getGrammarById - Fetches a grammar record by its ID.
 * @method getStartedGrammarList - Retrieves the list of grammar that the user has started.
 * @method syncGrammarData - Synchronizes grammar data from Supabase to the local IndexedDB.
 *
 */
export default class Grammar extends Entity<AppDB> implements GrammarLocal {
  id!: number;
  name!: string;
  note!: string;
  updated_at!: string;
  deleted_at!: string | null;

  /**
   * Returns a grammar record by its ID.
   *
   * @static
   * @param grammarId fetch grammar by ID
   * @returns A promise that resolves to the grammar record.
   * @throws Error if grammar is not found.
   */
  static async getGrammarById(grammarId: number): Promise<GrammarLocal> {
    const grammar = await db.grammar.get(grammarId);

    if (!grammar) {
      throw new Error(`Grammar with ID ${grammarId} not found.`);
    }

    return grammar;
  }

  /**
   * Fetches the list of grammar that the user has started.
   *
   * @static
   * @param userId - The user ID.
   * @returns Array of started GrammarLocal records, empty array in case of none found.
   * @throws Error if operation fails.
   */
  static async getStartedGrammarList(userId: string): Promise<GrammarLocal[]> {
    // select all started user items where started_at is not null
    const startedUserItems: UserItemLocal[] = await db.user_items
      .where('[user_id+started_at]')
      .between([userId, Dexie.minKey], [userId, config.database.nullReplacementDate], true, false)
      .toArray();

    // return empty array if no started user items found
    if (startedUserItems.length === 0) {
      return [];
    }

    // extract unique grammar IDs from the started user items
    const grammarIds = [...new Set(startedUserItems.map((item) => item.grammar_id))];

    // return empty array if no grammar IDs found
    if (grammarIds.length === 0) {
      return [];
    }

    // fetch grammar records by the extracted IDs
    const startedGrammar: GrammarLocal[] = await db.grammar.where('id').anyOf(grammarIds).toArray();
    return startedGrammar;
  }

  /**
   * Fetches grammar records from Supabase that were updated within a specified time range.
   *
   * @param lastSyncedAt - The start of the time range (inclusive). Defaults to the null replacement date from config.
   * @param newSyncedAt - The end of the time range (exclusive).
   * @returns A promise that resolves to an array of grammar records. Returns an empty array if no records are found.
   * @throws Error if the Supabase query fails.
   */
  private static async fetchGrammar(
    lastSyncedAt: string = config.database.nullReplacementDate,
    newSyncedAt: string,
  ): Promise<GrammarLocal[]> {
    const { data: grammar, error } = await supabaseInstance
      .from('grammar')
      .select('id, name, note, updated_at, deleted_at')
      .gte('updated_at', lastSyncedAt)
      .lt('updated_at', newSyncedAt);

    if (error) {
      throw new Error(`Failed to fetch grammar data from supabase: ${error.message}`);
    }

    return grammar ?? [];
  }

  /**
   * Applies grammar synchronization by processing items for deletion or upsert.
   *
   * Separates grammar items into two categories based on their `deleted_at` property:
   * - Items with `deleted_at === null` are upserted to the database
   * - Items with `deleted_at !== null` are marked for deletion
   *
   * @param grammar - Array of grammar items to synchronize
   * @returns A promise that resolves when the synchronization is complete
   * @private
   */
  private static async applyGrammarSync(grammar: GrammarLocal[]) {
    const toDelete: number[] = [];
    const toUpsert: GrammarLocal[] = [];
    grammar.forEach((item) => {
      if (item.deleted_at === null) {
        toUpsert.push(item);
      } else {
        toDelete.push(item.id);
      }
    });

    if (toDelete.length > 0) {
      await db.grammar.bulkDelete(toDelete);
    }
    if (toUpsert.length > 0) {
      await db.grammar.bulkPut(toUpsert);
    }
  }

  /**
   * Synchronizes grammar data from Supabase with local IndexedDB storage.
   *
   * Fetches grammar records that have been modified since the last sync timestamp,
   * applies the changes to the local database, and updates the sync metadata.
   *
   * @param lastSyncedAt - ISO string timestamp of the last synchronization
   * @returns Promise resolving to the number of grammar records synchronized
   * @throws Error if synchronization fails at any step
   */
  private static async syncGrammarData(lastSyncedAt: string): Promise<number> {
    // Step 1: Get the Synced dates for the grammar table
    const newSyncedAt = new Date().toISOString();

    // Step 2: Fetch grammar records from Supabase
    const grammar = await this.fetchGrammar(lastSyncedAt, newSyncedAt);

    // Step 3: Update local IndexedDB with the fetched grammar data
    await db.transaction('rw', db.grammar, db.metadata, async () => {
      if (grammar && grammar.length > 0) {
        await this.applyGrammarSync(grammar);
      } else {
        await Metadata.markAsSynced(TableName.Grammar, newSyncedAt);
      }
    });

    return grammar?.length ?? 0;
  }

  /**
   * Synchronizes grammar data since the last sync operation.
   * Retrieves the last synced timestamp for the Grammar table and then syncs
   * all grammar data that has been updated since that timestamp.
   * @returns A promise that resolves to the number of grammar records synchronized.
   */
  static async syncGrammarDataSinceLastSync(): Promise<number> {
    const lastSyncedAt = await Metadata.getSyncedAt(TableName.Grammar);
    return await this.syncGrammarData(lastSyncedAt);
  }

  /**
   * Synchronizes all grammar data from the remote source.
   * Uses the null replacement date from the application configuration as the synchronization point.
   * @returns A promise that resolves to the number of grammar records synchronized.
   */
  static async syncGrammarDataAll(): Promise<number> {
    return await this.syncGrammarData(config.database.nullReplacementDate);
  }
}
