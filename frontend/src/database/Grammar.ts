import { Entity } from "dexie";
import type AppDB from "@/database/AppDB";
import type { GrammarLocal } from "@/types/local.types";

export default class Grammar extends Entity<AppDB> implements GrammarLocal {
  id!: number;
  name!: string;
  note!: string;

  // Fetch a single record by ID
  async get() {
    return await this.db.grammars.get(this.id);
  }

  // Save or update multiple Grammar records
  static async saveAll(db: AppDB, grammars: Grammar[]) {
    return await db.grammars.bulkPut(grammars);
  }
}
