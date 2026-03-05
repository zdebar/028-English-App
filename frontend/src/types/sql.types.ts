// Conversion of UserItem for SQL storage, nullReplacements replaced with null for SQL
export interface UserItemSQL {
  user_id: string;
  item_id: number;
  progress: number;
  started_at: string | null;
  updated_at: string;
  next_at: string | null;
  mastered_at: string | null;
}
