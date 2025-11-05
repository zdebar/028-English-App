import { Entity } from "dexie";
import type AppDB from "@/database/models/app-db";
import type { GrammarLocal } from "@/types/local.types";
import { supabaseInstance } from "@/config/supabase.config";
import { db } from "@/database/models/db";
import { getUserId } from "@/utils/database.utils";

export default class Grammar extends Entity<AppDB> implements GrammarLocal {
  id!: number;
  name!: string;
  note!: string;

  static async getGrammarById(
    grammarId: number
  ): Promise<GrammarLocal | undefined> {
    return await db.grammars.get(grammarId);
  }

  static async getStartedGrammarList(): Promise<GrammarLocal[]> {
    const userId = await getUserId();
    if (!userId) {
      throw new Error("User is not logged in.");
    }

    const startedUserItems = await db.user_items
      .where("user_id")
      .equals(userId)
      .and((item) => item.started_at !== null)
      .toArray();

    const grammarIds = [
      ...new Set(
        startedUserItems
          .map((item) => item.grammar_id)
          .filter((id) => id !== null)
      ),
    ] as number[];

    const startedGrammars = await db.grammars
      .where("id")
      .anyOf(grammarIds)
      .toArray();

    return startedGrammars;
  }

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
