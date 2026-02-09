import { Entity } from 'dexie';
import type AppDB from '@/database/models/app-db';
import type { GrammarLocal, UserItemLocal } from '@/types/local.types';
import { supabaseInstance } from '@/config/supabase.config';
import { db } from '@/database/models/db';
import config from '@/config/config';
import Dexie from 'dexie';
import Metadata from './metadata';
import { TableName } from '@/types/local.types';
import { DatabaseError, SupabaseError } from '@/types/error.types';

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
   * @param grammarId fetch grammar by ID
   * @returns A promise that resolves to the grammar record.
   * @throws DatabaseError if grammar is not found. Error on database failure.
   */
  static async getGrammarById(grammarId: number): Promise<GrammarLocal> {
    const grammar = await db.grammar.get(grammarId);

    if (!grammar) {
      throw new DatabaseError(`Grammar with ID ${grammarId} not found.`, undefined, { grammarId });
    }

    return grammar;
  }

  /**
   * Fetches the list of grammar that the user has started.
   *
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

    // return empty array if no grammar IDs found. Could be in case of only vocabulary started but no grammar started.
    if (grammarIds.length === 0) {
      return [];
    }

    // fetch grammar records by the extracted IDs
    const startedGrammar: GrammarLocal[] = await db.grammar.where('id').anyOf(grammarIds).toArray();
    return startedGrammar;
  }

  /**
   * Synchronizes grammar data updated since the last sync operation from backend.
   *
   * @returns A promise that resolves to the number of grammar records synchronized.
   */
  static async syncGrammarDataSinceLastSync(): Promise<number> {
    const lastSyncedAt = await Metadata.getSyncedAt(TableName.Grammar);
    const newSyncedAt = new Date().toISOString();

    const grammar = await this.fetchGrammar(lastSyncedAt, newSyncedAt);
    await this.applyGrammarSync(grammar, newSyncedAt);

    return grammar?.length ?? 0;
  }

  /**
   * Synchronizes all grammar data from backend.
   *
   * @returns A promise that resolves to the number of grammar records synchronized.
   */
  static async syncGrammarDataAll(): Promise<number> {
    const lastSyncedAt = config.database.epochStartDate;
    const newSyncedAt = new Date().toISOString();

    const grammar = await this.fetchGrammar(lastSyncedAt, newSyncedAt);
    await db.grammar.clear();
    await this.applyGrammarSync(grammar, newSyncedAt);

    return grammar?.length ?? 0;
  }

  /**
   * Fetches grammar records from Supabase that were updated within a specified time range.
   *
   * @param lastSyncedAt - The start of the time range (inclusive). Defaults to the null replacement date from config.
   * @param newSyncedAt - The end of the time range (exclusive).
   * @returns A promise that resolves to an array of grammar records. Returns an empty array if no records are found.
   * @throws SupabaseError if the Supabase query fails.
   */
  private static async fetchGrammar(
    lastSyncedAt: string = config.database.epochStartDate,
    newSyncedAt: string,
  ): Promise<GrammarLocal[]> {
    const { data: grammar, error } = await supabaseInstance
      .from('grammar')
      .select('id, name, note, updated_at, deleted_at')
      .gte('updated_at', lastSyncedAt)
      .lt('updated_at', newSyncedAt);

    if (error) {
      throw new SupabaseError(`Failed to fetch grammar data from supabase`, error, {
        lastSyncedAt,
        newSyncedAt,
      });
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
   * @param newSyncedAt - The timestamp to mark the synchronization time in metadata
   * @returns A promise that resolves when the synchronization is complete
   * @private
   */
  private static async applyGrammarSync(grammar: GrammarLocal[], newSyncedAt: string) {
    await db.transaction('rw', db.grammar, db.metadata, async () => {
      if (grammar && grammar.length > 0) {
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
      await Metadata.markAsSynced(TableName.Grammar, newSyncedAt);
    });
  }
}
