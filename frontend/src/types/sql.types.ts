// Conversion of UserItem for SQL storage, nullReplacements replaced with null for SQL
export interface UserItemSQL {
  user_id: string;
  item_id: number;
  czech: string;
  english: string;
  pronunciation: string;
  audio: string | null;
  learnable: boolean;
  sort_order: number;
  progress: number;
  block_id: number | null;
  grammar_id: number | null;
  started_at: string | null;
  deleted_at: string | null;
  updated_at: string;
  next_at: string | null;
  mastered_at: string | null;
  lesson_id: number;
}
