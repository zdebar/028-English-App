export interface UserItemLocal {
  id: number;
  user_id: string;
  czech: string;
  english: string;
  pronunciation: string;
  audio: string | null;
  sequence: number;
  grammar_id: number | null;
  progress: number;
  started_at: string | null; // ISO 8601: "2025-10-24T12:00:00Z"
  updated_at: string | null; // ISO 8601: "2025-10-25T12:00:00Z"
  next_at: string; // ISO 8601: "2025-10-26T12:00:00Z"
  learned_at: string | null; // ISO 8601: "2025-10-27T12:00:00Z"
  mastered_at: string; // ISO 8601: "2025-10-28T12:00:00Z"
}

export interface GrammarLocal {
  id: number; // Unique identifier for the grammar entry
  name: string; // Name of the grammar topic
  note: string; // Description or note about the grammar topic
}

export interface UserScoreLocal {
  user_id: number; // Foreign key referencing the user
  date: string; // Date of the score in ISO format (e.g., "YYYY-MM-DD")
  item_count: number; // Number of items learned or completed on this date
}

export interface AudioRecordLocal {
  filename: string; // Unique name with extension
  blob: Blob; // The actual audio file as a Blob
}

export interface UserScore {
  learnedCountToday: number;
  learnedCountNotToday: number;
  practiceCountToday: number;
}
