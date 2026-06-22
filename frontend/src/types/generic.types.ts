export interface SyncEntityType {
  id: number;
  name: string;
  note: string;
  sort_order: number;
  deleted_at: string | null;
}

// Backward-compatible alias used by older model typings.
export interface RecordType extends SyncEntityType {}

export interface LessonType extends SyncEntityType {
  level_id: number;
}
export interface LevelType extends SyncEntityType {}

export interface GrammarType extends SyncEntityType {}

export interface BlockType extends SyncEntityType {}

export interface NoteType extends SyncEntityType {}

export interface ProgressCountsType {
  startedCount: number;
  startedTodayCount: number;
  masteredCount: number;
  masteredTodayCount: number;
  totalCount: number;
}

export interface LessonOverviewType extends LessonType, ProgressCountsType {}

export interface LevelOverviewType extends LevelType, ProgressCountsType {
  lessons: LessonOverviewType[];
}

export interface UserScoreType {
  user_id: string;
  date: string;
  item_count: number;
  updated_at: string;
  deleted_at: string | null;
}

export interface UserBlockType {
  user_id: string;
  block_id: number;
  name: string;
  note: string;
  sort_order: number;
  progress: number;
  is_vocabulary: boolean;
  started_at: string;
  updated_at: string;
  next_at: string;
  mastered_at: string;
  deleted_at: string;
}

export interface UserInfoType {
  id: string; // string for the user
  name: string | null; // User's full name
  email: string | null; // User's email address
  picture_url: string | null; // URL to the user's profile picture
}

export interface MetadataType {
  table_name: string; // Name of the table (e.g., "user_items", "grammar")
  user_id: string; // string of the user associated with the data
  synced_at: string; // Timestamp of the last synchronization
}
