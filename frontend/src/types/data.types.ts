import type { UUID } from "crypto";

// Users table
export interface UserSQL {
  id: UUID;
  username: string | null;
  settings: JSON;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// Grammar table
export interface GrammarSQL {
  id: number;
  name: string;
  note: string;
  updated_at: string;
  deleted_at: string | null;
}

// Items table
export interface ItemSQL {
  id: number;
  czech: string;
  english: string;
  pronunciation: string | null;
  audio: string | null;
  sequence: number;
  grammar_id: number | null;
  updated_at: string;
  deleted_at: string | null;
}

// User items table
export interface UserItemSQL {
  user_id: UUID;
  item_id: number;
  progress: number;
  started_at: string | null;
  updated_at: string;
  next_at: string | null;
  learned_at: string | null;
  mastered_at: string | null;
}

// User score table
export interface UserScoreSQL {
  user_id: UUID;
  date: string;
  item_count: number;
  updated_at: string;
}

export class UserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserError";
  }
}
