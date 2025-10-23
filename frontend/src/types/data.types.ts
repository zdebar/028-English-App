export interface PracticeItem {
  id: number;
  czech: string;
  english: string;
  pronunciation: string | null;
  audio: string | null;
  progress: number; // Startign from 0
  grammarId: number | null; // id of corresponding grammar rule, if any
}

export interface Grammar {
  id: number;
  name: string;
  note: string;
}

export type UserTheme = "light" | "dark" | "system";

export interface UserInfo {
  id: number;
  uid: string;
  username: string;
}

export interface UserScore {
  learnedCountToday: number;
  learnedCountNotToday: number;
  practiceCountToday: number;
}

export class UserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserError";
  }
}
