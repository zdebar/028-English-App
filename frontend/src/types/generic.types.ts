export interface SyncEntityType {
  id: number;
  name: string;
  note: string | null;
  sort_order: number;
  deleted_at: string | null;
}

// Backward-compatible alias used by older model typings.
export interface RecordType extends SyncEntityType {}

export interface LessonType extends SyncEntityType {
  level_id: number;
}
export interface LevelType extends SyncEntityType {}

export interface GrammarGroupType extends SyncEntityType {}

export interface GrammarChunkType extends SyncEntityType {
  grammar_group_id: number;
}

export interface GrammarChunkExampleType {
  grammar_chunk_id: number;
  item_id: number;
  sort_order: number;
  updated_at: string;
  deleted_at: string | null;
}

export interface BlockType {
  id: number;
  name: string;
  note: string | null;
  lesson_id: number;
  grammar_chunk_id: number | null;
  updated_at: string;
  deleted_at: string | null;
}

export interface TopicType extends SyncEntityType {}

export interface NoteType extends Omit<SyncEntityType, 'sort_order'> {
  note: string;
  sort_order: number | null;
}

export interface ProgressCountsType {
  startedCount: number;
  startedTodayCount: number;
  totalCount: number;
  currentProgress?: number;
  dailyProgressChange?: number;
  maximumProgress?: number;
}

export interface LessonOverviewType extends LessonType, ProgressCountsType {}

export interface LevelOverviewType extends LevelType, ProgressCountsType {
  lessons: LessonOverviewType[];
}

export interface ReadyPracticeState {
  reviewReadyAt: string | null;
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
