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
   * Synchronizes grammar data from Supabase to the local IndexedDB.
   * - Fetches updated grammar records from Supabase newer than the last synced date from metadata table.
   * - Updates or deletes records in the local IndexedDB based on the fetched data.
   * - Updates the metadata table with the new sync time.
   *
   * @returns The number of grammar records synced.
   * @throws Error if any step of the synchronization process fails.
   */
  static async syncGrammarData(): Promise<number> {
    // Step 1: Get the last synced date for the grammar table
    const lastSyncedAt = await Metadata.getSyncedDate(TableName.Grammar);

    // Step 2: Fetch grammar records from Supabase newer than the last synced date
    const { data: grammar, error } = await supabaseInstance
      .from('grammar')
      .select('id, name, note, updated_at, deleted_at')
      .gt('updated_at', lastSyncedAt);

    if (error) {
      throw new Error(`Failed to fetch data from supabase: ${error.message}`);
    }

    // Step 3: Update or delete records in the local IndexedDB
    const newSyncTime = new Date().toISOString();

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

      await db.transaction('rw', db.grammar, db.metadata, async () => {
        if (toDelete.length > 0) {
          await db.grammar.bulkDelete(toDelete);
        }
        if (toUpsert.length > 0) {
          await db.grammar.bulkPut(toUpsert);
        }
        await Metadata.markAsSynced(TableName.Grammar, newSyncTime);
      });
    } else {
      await Metadata.markAsSynced(TableName.Grammar, newSyncTime);
    }

    return grammar?.length ?? 0;
  }
}
