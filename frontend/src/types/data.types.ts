export interface PracticeItem {
  id: number;
  czech: string;
  english: string;
  pronunciation: string | null;
  audio: string | null;
  progress: number; // Startign from 0
  grammarId: number | null; // id of corresponding grammar rule, if any
}

export interface Grammar {
  id: number;
  name: string;
  note: string;
}

export type UserTheme = "light" | "dark" | "system";

export interface UserInfo {
  id: number | null;
  uid: string;
  username: string | null;
  picture: string | null;
}

export interface UserScore {
  learnedCountToday: number;
  learnedCountNotToday: number;
  practiceCountToday: number;
}

export class UserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserError";
  }
}

export interface UserItem {
  id: number;
  user_id: number;
  czech: string;
  english: string;
  pronunciation: string;
  audio: string | null;
  sequence: number;
  grammar_id: number | null;
  progress: number;
  started_at: string | null; // ISO 8601: "2025-10-24T12:00:00Z"
  updated_at: string | null; // ISO 8601: "2025-10-25T12:00:00Z"
  next_at: string | null; // ISO 8601: "2025-10-26T12:00:00Z"
  learned_at: string | null; // ISO 8601: "2025-10-27T12:00:00Z"
  mastered_at: string | null; // ISO 8601: "2025-10-28T12:00:00Z"
}

export interface Grammar {
  grammar_id: number; // Unique identifier for the grammar entry
  grammar_name: string; // Name of the grammar topic
  grammar_note: string; // Description or note about the grammar topic
}

export interface UserDailyScore {
  user_id: number; // Foreign key referencing the user
  date: string; // Date of the score in ISO format (e.g., "YYYY-MM-DD")
  item_count: number; // Number of items learned or completed on this date
}

export interface AudioRecord {
  filename: string; // Unique name with extension
  blob: Blob; // The actual audio file as a Blob
}

export interface Metadata {
  filename: string;
  version: number; // Version number of the object store
  last_updated: string; // ISO 8601 date string
  description: string; // Description of the data
}
