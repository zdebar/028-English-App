import { Entity } from "dexie";
import type AppDB from "@/database/models/app-db";
import type { GrammarLocal, UserItemLocal } from "@/types/local.types";
import { supabaseInstance } from "@/config/supabase.config";
import { db } from "@/database/models/db";
import config from "@/config/config";
import Dexie from "dexie";
import {
  validateNonNegativeInteger,
  validateUUID,
} from "@/utils/validation.utils";

export default class Grammar extends Entity<AppDB> implements GrammarLocal {
  id!: number;
  name!: string;
  note!: string;

  /**
   * Returns a grammar record by its ID.
   * @param grammarId fetch grammar by ID
   * @returns A promise that resolves to the grammar record or `undefined` if not found.
   * @throws Error if grammarId is not a positive integer or if grammar is not found.
   */
  static async getGrammarById(grammarId: number): Promise<GrammarLocal> {
    validateNonNegativeInteger(grammarId, "grammarId");

    const grammar = await db.grammars.get(grammarId);
    if (!grammar) {
      throw new Error(`Grammar with ID ${grammarId} not found.`);
    }
    return grammar;
  }

  /**
   * Fetches the list of grammars that the user has started.
   * @returns Array of started GrammarLocal records
   */
  static async getStartedGrammarList(userId: string): Promise<GrammarLocal[]> {
    validateUUID(userId, "userId");

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
      ...new Set(
        startedUserItems
          .map((item) => item.grammar_id)
          .filter(
            (grammar_id) => grammar_id !== config.database.nullReplacementNumber
          )
      ),
    ] as number[];

    const startedGrammars: GrammarLocal[] = await db.grammars
      .where("id")
      .anyOf(grammarIds)
      .toArray();

    return startedGrammars;
  }

  /**
   * Synchronizes grammar data from Supabase to the local IndexedDB.
   * In case of an error during fetching, it logs the error to the console, but does not throw.
   * @returns void
   */
  static async syncGrammarData(): Promise<void> {
    const {
      data: grammars,
      error,
    }: {
      data: GrammarLocal[] | null;
      error: Error | null;
    } = await supabaseInstance.from("grammar").select("id, name, note");

    if (error) {
      throw new Error(`Failed to sync grammar data: ${error.message}`);
      return;
    }

    if (grammars) {
      await db.grammars.bulkPut(grammars);
    }
  }
}
