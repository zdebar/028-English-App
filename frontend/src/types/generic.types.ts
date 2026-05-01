export interface RecordType {
  id: number;
  name: string;
  note: string;
  sort_order: number;
  deleted_at: string | null;
}

export interface LessonType extends RecordType {
  level_id: number;
}
export interface LevelType extends RecordType {}

export interface GrammarType extends RecordType {}

export interface BlockType extends RecordType {}

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

export type HookStatus = 'idle' | 'loading' | 'success' | 'error';