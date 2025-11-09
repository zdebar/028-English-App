import { Entity } from "dexie";
import type AppDB from "@/database/models/app-db";
import type { GrammarLocal, UserItemLocal } from "@/types/local.types";
import { supabaseInstance } from "@/config/supabase.config";
import { db } from "@/database/models/db";
import config from "@/config/config";
import Dexie from "dexie";

export default class Grammar extends Entity<AppDB> implements GrammarLocal {
  id!: number;
  name!: string;
  note!: string;

  /**
   * Returns a grammar record by its ID.
   * @param grammarId fetch grammar by ID
   * @returns A promise that resolves to the grammar record or `undefined` if not found.
   */
  static async getGrammarById(grammarId: number): Promise<GrammarLocal> {
    if (!grammarId || grammarId <= 0) {
      throw new Error("Invalid grammar ID provided.");
    }

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
    if (!userId) {
      throw new Error("User is not logged in.");
    }

    const startedUserItems: UserItemLocal[] = await db.user_items
      .where("[user_id + started_at]")
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
      console.error("Error fetching grammar data from Supabase:", error);
      return;
    }

    if (grammars) {
      await db.grammars.bulkPut(grammars);
    }
  }
}
