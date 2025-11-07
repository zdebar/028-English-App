export interface UserItemLocal {
  item_id: number;
  user_id: string;
  czech: string;
  english: string;
  pronunciation: string;
  audio: string | null;
  sequence: number;
  grammar_id: number | null;
  progress: number;
  started_at: string; // ISO 8601: "2025-10-24T12:00:00Z"
  updated_at: string; // ISO 8601: "2025-10-25T12:00:00Z"
  next_at: string; // ISO 8601: "2025-10-26T12:00:00Z"
  learned_at: string; // ISO 8601: "2025-10-27T12:00:00Z"
  mastered_at: string; // ISO 8601: "2025-10-28T12:00:00Z"
}

export interface GrammarLocal {
  id: number; // Unique identifier for the grammar entry
  name: string; // Name of the grammar topic
  note: string; // Description or note about the grammar topic
}

export interface UserScoreLocal {
  id: string; // uuid for the user
  user_id: string; // Foreign key referencing the user
  date: string; // Date of the score in ISO format (e.g., "YYYY-MM-DD")
  item_count: number; // Number of items learned or completed on this date
}

export interface UserInfoLocal {
  id: string; // uuid for the user
  name: string | null; // User's full name
  email: string | null; // User's email address
  picture_url: string | null; // URL to the user's profile picture
}

export interface AudioRecordLocal {
  filename: string; // Unique name with extension
  audioBlob: Blob; // The actual audio file as a Blob
}

export interface AudioMetadataLocal {
  archive_name: string; // Name of the audio archive (e.g., "audio_part1.zip")
  fetched_at: string; // Timestamp when the archive was fetched
}

export interface UserStatsLocal {
  learnedCountToday: number | null;
  learnedCount: number | null;
  practiceCountToday: number | null;
}
