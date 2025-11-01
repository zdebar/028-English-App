// Grammar table
export interface GrammarSQL {
  id: number;
  name: string;
  note: string;
}

// Blocks table
export interface BlockSQL {
  id: number;
  name: string;
  sequence: number;
  grammar_id: number | null;
}

// Items table
export interface ItemSQL {
  id: number;
  czech: string;
  english: string;
  pronunciation: string | null;
  audio: string | null;
  sequence: number;
  block_id: number | null;
}

// User items table
export interface UserItemSQL {
  user_id: string;
  item_id: number;
  progress: number;
  started_at: string;
  updated_at: string;
  next_at: string | null;
  learned_at: string | null;
  mastered_at: string | null;
}

// User score table
export interface UserScoreSQL {
  user_id: string;
  date: string;
  item_count: number;
}

export class UserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserError";
  }
}
