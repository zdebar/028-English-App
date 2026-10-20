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
  group_id: number | null;
}
export interface LevelType extends SyncEntityType {}


export interface NoteType extends Omit<SyncEntityType, 'sort_order'> {
  note: string;
  sort_order: number | null;
}

export interface ProgressCountsType {
  startedCount: number;
  initiatedCount: number;
  startedTodayCount: number;
  totalCount: number;
}

export interface LessonOverviewType extends LessonType, ProgressCountsType {
  isStarted: boolean;
}

export interface LevelOverviewType extends LevelType, ProgressCountsType {
  lessons: LessonOverviewType[];
}

export interface ReadyPracticeState {
  grammarReviewReadyAt: string | null;
  vocabularyReviewReadyAt: string | null;
  grammarReviewDueCount: number;
  vocabularyReviewDueCount: number;
  nextReviewAt: string | null;
}

export interface UserInfoType {
  id: string; // string for the user
  name: string | null; // User's full name
  email: string | null; // User's email address
  picture_url: string | null; // URL to the user's profile picture
}

export interface UserSettingsType {
  id: string;
  max_new_lessons_per_day: number;
  updated_at: string;
}

export interface UserLessonType {
  user_id: string;
  lesson_id: number;
  started_at: string;
}

export interface MetadataType {
  table_name: string; // Name of the table (e.g., "user_items", "grammar")
  user_id: string; // string of the user associated with the data
  synced_at: string; // Timestamp of the last synchronization
}
