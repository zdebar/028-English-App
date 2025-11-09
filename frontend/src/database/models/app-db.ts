import config from "@/config/config";
import Dexie, { type EntityTable } from "dexie";
import Grammar from "@/database/models/grammar";
import AudioRecord from "@/database/models/audio-records";
import UserItem from "@/database/models/user-items";
import UserScore from "@/database/models/user-scores";
import AudioMetadata from "@/database/models/audio-metadata";

export default class AppDB extends Dexie {
  user_items!: EntityTable<UserItem, "item_id">;
  grammars!: EntityTable<Grammar, "id">;
  user_scores!: EntityTable<UserScore, "id">;
  audio_records!: EntityTable<AudioRecord, "filename">;
  audio_metadata!: EntityTable<AudioMetadata, "archive_name">;

  constructor() {
    super(config.database.dbName);

    // Define the database schema
    this.version(1).stores({
      user_items:
        "item_id, next_at, started_at, learned_at, [user_id+mastered_at+next_at]",
      grammars: "id",
      user_scores: "id, user_id, [user_id+date]",
      audio_records: "filename",
      audio_metadata: "archive_name",
    });
    // Initialize tables and map them to classes
    this.on("ready", () => {
      this.user_items.mapToClass(UserItem);
      this.grammars.mapToClass(Grammar);
      this.user_scores.mapToClass(UserScore);
      this.audio_records.mapToClass(AudioRecord);
      this.audio_metadata.mapToClass(AudioMetadata);
    });
  }
}
