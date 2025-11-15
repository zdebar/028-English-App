import { Entity } from "dexie";
import type AppDB from "@/database/models/app-db";
import type { GrammarLocal, UserItemLocal } from "@/types/local.types";
import { supabaseInstance } from "@/config/supabase.config";
import { db } from "@/database/models/db";
import config from "@/config/config";
import Dexie from "dexie";
import type { UUID } from "crypto";
import Metadata from "./metadata";
import { TableName } from "@/types/local.types";

export default class Grammar extends Entity<AppDB> implements GrammarLocal {
  id!: number;
  name!: string;
  note!: string;
  updated_at!: string;
  deleted_at!: string | null;

  /**
   * Returns a grammar record by its ID.
   * @param grammarId fetch grammar by ID
   * @returns A promise that resolves to the grammar record or `undefined` if not found.
   * @throws Error if grammarId is not a positive integer or if grammar is not found.
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
   * @param userId - The user ID.
   * @returns Array of started GrammarLocal records, empty array in case of none found.
   * @throws Error if operation fails.
   */
  static async getStartedGrammarList(userId: UUID): Promise<GrammarLocal[]> {
    const startedUserItems: UserItemLocal[] = await db.user_items
      .where("[user_id+started_at]")
      .between(
        [userId, Dexie.minKey],
        [userId, config.database.nullReplacementDate],
        true,
        false
      )
      .toArray();

    const grammarIds = [
      ...new Set(startedUserItems.map((item) => item.grammar_id)),
    ];

    const startedgrammar: GrammarLocal[] = await db.grammar
      .where("id")
      .anyOf(grammarIds)
      .toArray();

    return startedgrammar;
  }

  /**
   * Synchronizes grammar data from Supabase to the local IndexedDB.
   * In case of an error during fetching, it logs the error to the console, but does not throw.
   * @returns The number of grammar records synced.
   * @throws Error if any step of the synchronization process fails.
   */
  static async syncGrammarData(): Promise<number> {
    // Step 1: Get the last synced date for the grammar table
    const lastSyncedAt = await Metadata.getSyncedDate(TableName.Grammar);

    // Step 2: Fetch synced time
    const newSyncTime = new Date().toISOString();

    // Step 3: Fetch grammar records from Supabase newer than the last synced date
    const { data: grammar, error } = await supabaseInstance
      .from("grammar")
      .select("id, name, note, updated_at, deleted_at")
      .gt("updated_at", lastSyncedAt);

    if (error) {
      throw new Error(`Failed to fetch data from supabase: ${error.message}`);
    }

    // Step 4: Split the fetched grammar records by deleted_at
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

    // Step 5: Update the metadata table with the new sync time
    await Metadata.markAsSynced(TableName.Grammar, newSyncTime);

    return grammar.length;
  }
}
