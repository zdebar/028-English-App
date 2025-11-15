import config from "@/config/config";
import Dexie, { type EntityTable } from "dexie";
import Grammar from "@/database/models/grammar";
import AudioRecord from "@/database/models/audio-records";
import UserItem from "@/database/models/user-items";
import UserScore from "@/database/models/user-scores";
import AudioMetadata from "@/database/models/audio-metadata";
import Metadata from "@/database/models/metadata";
import "dexie-observable";

export default class AppDB extends Dexie {
  user_items!: EntityTable<UserItem, "item_id">;
  grammar!: EntityTable<Grammar, "id">;
  user_scores!: EntityTable<UserScore, "id">;
  audio_records!: EntityTable<AudioRecord, "filename">;
  audio_metadata!: EntityTable<AudioMetadata, "archive_name">;
  metadata!: EntityTable<Metadata, "table_name">;

  constructor() {
    super(config.database.dbName);

    // Define the database schema
    this.version(4).stores({
      user_items:
        "item_id, user_id, [user_id+item_id], [user_id+learned_at], [user_id+next_at], [user_id+mastered_at+next_at+sequence], [user_id+started_at+grammar_id], [user_id+updated_at]",
      grammar: "id",
      user_scores: "id, user_id, [user_id+updated_at]",
      audio_records: "filename",
      audio_metadata: "archive_name",
      metadata: "table_name, [table_name+user_id]",
    });
    // Initialize tables and map them to classes
    this.on("ready", () => {
      this.user_items.mapToClass(UserItem);
      this.grammar.mapToClass(Grammar);
      this.user_scores.mapToClass(UserScore);
      this.audio_records.mapToClass(AudioRecord);
      this.audio_metadata.mapToClass(AudioMetadata);
      this.metadata.mapToClass(Metadata);
    });
  }
}
