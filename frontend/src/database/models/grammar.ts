import { Entity } from "dexie";
import type AppDB from "@/database/models/app-db";
import type { GrammarLocal } from "@/types/local.types";
import { supabaseInstance } from "@/config/supabase.config";
import { db } from "@/database/models/db";

export default class Grammar extends Entity<AppDB> implements GrammarLocal {
  id!: number;
  name!: string;
  note!: string;

  static async getGrammarById(
    grammarId: number
  ): Promise<GrammarLocal | undefined> {
    return await db.grammars.get(grammarId);
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
