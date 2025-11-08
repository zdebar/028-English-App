import { Entity } from "dexie";
import type AppDB from "@/database/models/app-db";
import type { GrammarLocal, UserItemLocal } from "@/types/local.types";
import { supabaseInstance } from "@/config/supabase.config";
import { db } from "@/database/models/db";
import { getUserId } from "@/utils/database.utils";
import config from "@/config/config";

export default class Grammar extends Entity<AppDB> implements GrammarLocal {
  id!: number;
  name!: string;
  note!: string;

  static async getGrammarById(
    grammarId: number
  ): Promise<GrammarLocal | undefined> {
    try {
      return await db.grammars.get(grammarId);
    } catch (error) {
      console.error("Error fetching grammar by ID:", error);
      return undefined;
    }
  }

  static async getStartedGrammarList(): Promise<GrammarLocal[]> {
    try {
      const userId = await getUserId();
      if (!userId) {
        throw new Error("User is not logged in.");
      }

      const startedUserItems: UserItemLocal[] = await db.user_items
        .where("user_id")
        .equals(userId)
        .and((item) => item.started_at !== config.database.nullReplacementDate)
        .toArray();

      const grammarIds = [
        ...new Set(
          startedUserItems
            .map((item) => item.grammar_id)
            .filter((grammar_id) => grammar_id !== null)
        ),
      ] as number[];

      const startedGrammars: GrammarLocal[] = await db.grammars
        .where("id")
        .anyOf(grammarIds)
        .toArray();

      return startedGrammars;
    } catch (error) {
      console.error("Error fetching started grammar list:", error);
      return [];
    }
  }

  static async syncGrammarData(): Promise<void> {
    try {
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
    } catch (error) {
      console.error("Error syncing grammar data:", error);
    }
  }
}
