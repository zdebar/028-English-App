export interface ProgressHistoryEntry {
  progress: number;
  created_at: string;
}

export interface UserItemBase {
  user_id: string;
  item_id: number;
  czech: string;
  english: string;
  pronunciation: string;
  audio: string | null;
  sort_order: number;
  progress: number;
  progress_history: ProgressHistoryEntry[];
  lesson_id: number;
  updated_at: string;
}

export interface UserItemAPI extends UserItemBase {
  is_study_item: boolean;
  is_vocabulary: boolean;
  note_id: number | null;
  block_id: number | null;
  grammar_id: number | null;
  started_at: string | null;
  deleted_at: string | null;
  next_at: string | null;
  mastered_at: string | null;
}

export type UserItemExport = Pick<
  UserItemAPI,
  | 'user_id'
  | 'item_id'
  | 'progress'
  | 'progress_history'
  | 'started_at'
  | 'updated_at'
  | 'next_at'
  | 'mastered_at'
>;

export interface UserItemLocal extends UserItemBase {
  is_study_item: 0 | 1;
  is_vocabulary: 0 | 1;
  note_id: number;
  block_id: number;
  grammar_id: number;
  started_at: string;
  deleted_at: string;
  next_at: string;
  mastered_at: string;
}

export interface UserItemPractice extends UserItemLocal {
  show_new_grammar_indicator: boolean;
}
