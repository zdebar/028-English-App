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
  note_id: number | null;
  lesson_id: number;
  updated_at: string;
}

export interface UserItemLocal extends UserItemBase {
  is_vocabulary: 0 | 1;
  is_practice_item: 0 | 1;
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

export type ReviewPracticeMode = 'vocabulary' | 'grammar';
