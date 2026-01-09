import type { UUID } from 'crypto';

export interface UserItemLocal {
  // As used by IndexedDB
  item_id: number;
  user_id: UUID;
  czech: string;
  english: string;
  pronunciation: string;
  audio: string | null;
  sequence: number;
  grammar_id: number; // null replaced with config.database.nullReplacementNumber
  progress: number;
  started_at: string; // nulls replaced with config.database.nullReplacementDate
  updated_at: string;
  deleted_at: string | null;
  next_at: string; // nulls replaced with config.database.nullReplacementDate
  mastered_at: string; // nulls replaced with config.database.nullReplacementDate
}

export interface UserItemPractice extends UserItemLocal {
  // As used by PracticeCard
  is_initial_practice: boolean;
}

export interface GrammarLocal {
  id: number;
  name: string;
  note: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface UserScoreLocal {
  id: string;
  user_id: UUID;
  date: string;
  item_count: number;
  updated_at: string;
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

export interface MetadataLocal {
  table_name: string; // Name of the table (e.g., "user_items", "grammar")
  user_id: UUID; // UUID of the user associated with the data
  synced_at: string; // Timestamp of the last synchronization
}

export interface UserStatsLocal {
  startedCountToday?: number;
  startedCount?: number;
  practiceCountToday?: number;
}

export interface LessonsLocal {
  lessonId: number;
  previousCount: number;
  todayCount: number;
}

export const TableName = {
  Grammar: 'grammar',
  UserScores: 'user_scores',
  UserItems: 'user_items',
} as const;

export type TableName = (typeof TableName)[keyof typeof TableName];
