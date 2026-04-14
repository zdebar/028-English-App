export interface UserItemLocal {
  item_id: number;
  user_id: string;
  czech: string;
  english: string;
  pronunciation: string;
  audio: string | null;
  sort_order: number;
  progress: number;
  grammar_id: number; // null replaced with config.database.nullReplacementNumber
  started_at: string; // nulls replaced with config.database.nullReplacementDate
  updated_at: string;
  deleted_at: string; // nulls replaced with config.database.nullReplacementDate
  next_at: string; // nulls replaced with config.database.nullReplacementDate
  mastered_at: string; // nulls replaced with config.database.nullReplacementDate
  lesson_id: number;
}

export interface UserItemPractice extends UserItemLocal {
  show_new_grammar_indicator: boolean;
}

export interface RecordLocal {
  id: number;
  name: string;
  note: string;
  sort_order: number;
  deleted_at: string | null;
}

export interface LessonLocal extends RecordLocal {
  level_id: number;
}
export interface LevelLocal extends RecordLocal {}

export interface GrammarLocal extends RecordLocal {}

export interface ProgressCounts {
  startedCount: number;
  startedTodayCount: number;
  masteredCount: number;
  masteredTodayCount: number;
  totalCount: number;
}

export interface LessonOverview extends LessonLocal, ProgressCounts {}

export interface LevelOverview extends LevelLocal, ProgressCounts {
  lessons: LessonOverview[];
}



export interface UserScoreLocal {
  user_id: string;
  date: string;
  item_count: number;
  updated_at: string;
  deleted_at: string | null;
}

export interface UserInfoLocal {
  id: string; // string for the user
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
  user_id: string; // string of the user associated with the data
  synced_at: string; // Timestamp of the last synchronization
}

export const TableName = {
  Grammar: 'grammar',
  UserScores: 'user_scores',
  UserItems: 'user_items',
  Levels: 'levels',
  Lessons: 'lessons',
} as const;

export type TableName = (typeof TableName)[keyof typeof TableName];
