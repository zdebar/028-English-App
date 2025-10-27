export interface UserItem {
  id: number;
  user_id: number | null;
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

export const user_items: UserItem = {
  id: 1,
  user_id: 1,
  czech: "dům",
  english: "house",
  pronunciation: "/haʊs/",
  audio: "house",
  sequence: 1,
  grammar_id: 1,
  progress: 50,
  started_at: "2025-10-24T12:00:00Z",
  updated_at: "2025-10-25T12:00:00Z",
  next_at: "2025-10-26T12:00:00Z",
  learned_at: "2025-10-27T12:00:00Z",
  mastered_at: "2025-10-28T12:00:00Z",
};

export interface Grammar {
  id: number; // Unique identifier for the grammar entry
  grammar_name: string; // Name of the grammar topic
  grammar_note: string; // Description or note about the grammar topic
}

export const grammar: Grammar = {
  id: 1,
  grammar_name: "Present Simple",
  grammar_note: "Used for habits and routines",
};

export interface UserDailyScore {
  user_id: number; // Foreign key referencing the user
  date: string; // Date of the score in ISO format (e.g., "YYYY-MM-DD")
  item_count: number; // Number of items learned or completed on this date
}

export const user_daily_score: UserDailyScore = {
  user_id: 1,
  date: "2025-10-24",
  item_count: 10,
};

export interface Audio {
  id: number; // Unique identifier for the audio entry
  filename: string; // Unique name with extension
  blob: Blob; // The actual audio file as a Blob
}
