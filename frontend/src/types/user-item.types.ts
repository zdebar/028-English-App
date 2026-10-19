import type { GrammarChunkWithExamples } from '@/database/models/grammar-chunks';
import type { NoteType } from './generic.types';
import type { ReviewDirection } from './practice.types';

export type PracticeOutcome = 'correct' | 'incorrect' | 'skip' | 'repeat' | 'hard' | 'good' | 'easy';

export type CurriculumSortPath = readonly [
  levelSortOrder: number,
  lessonSortOrder: number,
  itemSortOrder: number,
];

export interface UserItemBase {
  user_id: string;
  item_id: number;
  czech: string;
  czech_description: string | null;
  english: string;
  pronunciation: string;
  audio: string | null;
  sort_order: number;
  progress_cz_to_en: number;
  progress_en_to_cz: number;
  is_cz_to_en_enabled: boolean;
  is_en_to_cz_enabled: boolean;
  note_id: number | null;
  lesson_id: number;
  updated_at: string;
}

export interface UserItemLocal extends UserItemBase {
  /** Set only on transient practice entries to identify the active review direction. */
  review_direction?: ReviewDirection;
  is_vocabulary: 0 | 1;
  topic_id: number;
  grammar_chunk_id: number;
  started_at: string;
  deleted_at: string;
  next_at_cz_to_en: string;
  mastered_at_cz_to_en: string;
  next_at_en_to_cz: string;
  mastered_at_en_to_cz: string;
  curriculum_sort_path: CurriculumSortPath;
}

export type PracticeDeckItem = UserItemLocal;

export type ResolvedPracticeEntry<T extends UserItemLocal> = Readonly<{
  item: T;
  note: NoteType | null;
  grammar: GrammarChunkWithExamples | null;
}>;

export type PracticeDeckEntry = ResolvedPracticeEntry<PracticeDeckItem>;

export type InitialTrainingSelection = Readonly<{
  lessonId: number;
  items: UserItemLocal[];
}>;
