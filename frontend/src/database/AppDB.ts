import config from "@/config/config";
import Dexie, { type EntityTable } from "dexie";
import type {
  GrammarLocal,
  UserScoreLocal,
  UserItemLocal,
  AudioRecordLocal,
} from "@/types/local.types";
import Grammar from "@/database/Grammar";
import AudioRecord from "@/database/AudioRecord";
import UserItem from "./UserItem";
import UserScore from "@/database/UserScore";

export default class AppDB extends Dexie {
  user_items!: EntityTable<UserItemLocal, "user_id">;
  grammars!: EntityTable<GrammarLocal, "id">;
  user_scores!: EntityTable<UserScoreLocal, "user_id">;
  audio_records!: EntityTable<AudioRecordLocal, "filename">;

  constructor() {
    super(config.dbName);
    this.version(1).stores({
      userItems: "[user_id+mastered_at+next_at]",
      grammar: "id",
      userDailyScores: "[user_id+date]",
      audio: "filename",
    });
    this.user_items.mapToClass(UserItem);
    this.grammars.mapToClass(Grammar);
    this.user_scores.mapToClass(UserScore);
    this.audio_records.mapToClass(AudioRecord);
  }
}
