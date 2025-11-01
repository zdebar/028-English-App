import { Entity } from "dexie";
import type AppDB from "@/database/AppDB";
import type { AudioRecordLocal } from "@/types/local.types";

export default class AudioRecord
  extends Entity<AppDB>
  implements AudioRecordLocal
{
  filename!: string;
  blob!: Blob;

  // Fetch a single record by ID
  async get() {
    return await this.db.audio_records.get(this.filename);
  }

  // Save or update multiple Grammar records
  static async saveAll(db: AppDB, audioRecords: AudioRecordLocal[]) {
    return await db.audio_records.bulkPut(audioRecords);
  }
}
