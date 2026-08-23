import type { GrammarChunkWithExamples } from '@/database/models/grammar-chunks';
import type { NoteType } from './generic.types';

export type PracticeDirection = 'czToEn' | 'enToCz';
export type PracticeOutcome = 'correct' | 'incorrect' | 'skip';

export interface ProgressHistoryEntry {
  progress: number;
  created_at: string;
  direction: PracticeDirection;
  outcome: PracticeOutcome;
}

export type CurriculumSortPath = readonly [
  levelSortOrder: number,
  lessonSortOrder: number,
  itemSortOrder: number,
];

export interface UserItemBase {
  user_id: string;
  item_id: number;
  czech: string;
  english: string;
  pronunciation: string;
  audio: string | null;
  sort_order: number;
  progress_cz_to_en: number;
  progress_en_to_cz: number;
  progress_history: ProgressHistoryEntry[];
  note_id: number | null;
  lesson_id: number;
  updated_at: string;
}

export interface UserItemLocal extends UserItemBase {
  is_vocabulary: 0 | 1;
  is_practice_item: 0 | 1;
  has_pronunciation_practice: 0 | 1;
  block_id: number;
  grammar_chunk_id: number;
  started_at: string;
  deleted_at: string;
  next_at_cz_to_en: string;
  next_at_en_to_cz: string;
  mastered_at_cz_to_en: string;
  mastered_at_en_to_cz: string;
  curriculum_sort_path: CurriculumSortPath;
}

export interface PracticeDeckItem extends UserItemLocal {
  practice_direction: PracticeDirection;
}

export type ResolvedPracticeEntry<T extends UserItemLocal> = Readonly<{
  item: T;
  note: NoteType | null;
  grammar: GrammarChunkWithExamples | null;
}>;

export type PracticeDeckEntry = ResolvedPracticeEntry<PracticeDeckItem>;
