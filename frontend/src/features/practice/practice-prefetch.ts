import Lessons from '@/database/models/lessons';
import UserItem from '@/database/models/user-items';
import {
  resolvePracticeEntries,
  resolvePracticeGrammarContext,
} from '@/database/utils/practice-content.utils';
import type { GrammarChunkWithExamples } from '@/database/models/grammar-chunks';
import type { LessonType, GrammarGroupType } from '@/types/generic.types';
import type {
  ResolvedPracticeEntry,
  UserItemLocal,
} from '@/types/user-item.types';
import {
  clearReviewArrays,
  invalidateReviewArrays,
  warmReviewArrays,
} from './review-prefetch';

export type PreparedInitialLesson = Readonly<{
  lesson: LessonType | null;
  items: UserItemLocal[];
  entries: Array<ResolvedPracticeEntry<UserItemLocal>>;
  grammar: GrammarChunkWithExamples | null;
  grammarGroup: GrammarGroupType | null;
}>;

type PracticePrefetchState = {
  nextInitialLesson: PreparedInitialLesson | null;
  dirty: boolean;
  version: number;
  pending: Promise<void> | null;
};

const states = new Map<string, PracticePrefetchState>();

function createState(): PracticePrefetchState {
  return {
    nextInitialLesson: null,
    dirty: true,
    version: 0,
    pending: null,
  };
}

function getState(userId: string): PracticePrefetchState {
  let state = states.get(userId);
  if (!state) {
    state = createState();
    states.set(userId, state);
  }
  return state;
}

async function loadPreparedInitialLesson(
  userId: string,
): Promise<PreparedInitialLesson | null> {
  const selection = await UserItem.getNextInitialTrainingSelection(userId);
  if (!selection || selection.items.length === 0) return null;

  const lesson = await Lessons.getById(selection.lessonId);
  if (!lesson) return null;

  const [entries, grammarContext] = await Promise.all([
    resolvePracticeEntries(userId, selection.items),
    resolvePracticeGrammarContext(userId, lesson.grammar_chunk_id),
  ]);
  return {
    lesson,
    items: selection.items,
    entries,
    grammar: grammarContext.grammar,
    grammarGroup: grammarContext.grammarGroup,
  };
}

/** Loads review arrays and prepares the next initial lesson until explicit invalidation. */
export async function warmPracticeCache(userId: string): Promise<void> {
  const state = getState(userId);
  if (state.pending) {
    await state.pending;
    return warmPracticeCache(userId);
  }
  if (!state.dirty) return;

  const version = state.version;
  let pending: Promise<void>;
  pending = (async () => {
    const [, nextInitialLesson] = await Promise.all([
      warmReviewArrays(userId),
      loadPreparedInitialLesson(userId),
    ]);
    if (states.get(userId) !== state || state.version !== version) return;
    state.nextInitialLesson = nextInitialLesson;
    state.dirty = false;
  })().finally(() => {
    if (state.pending === pending) state.pending = null;
  });

  state.pending = pending;
  await pending;
  if (states.get(userId) === state && state.version !== version) {
    return warmPracticeCache(userId);
  }
}

export async function getPrefetchedNextInitialLesson(userId: string): Promise<PreparedInitialLesson | null> {
  await warmPracticeCache(userId);
  return getState(userId).nextInitialLesson;
}

export function invalidateNextInitialLesson(userId: string): void {
  const state = states.get(userId);
  if (!state) return;
  state.version += 1;
  state.dirty = true;
}

export function invalidatePracticeCache(userId: string): void {
  invalidateReviewArrays(userId);
  invalidateNextInitialLesson(userId);
}

export function clearPracticeCache(userId: string | null): void {
  clearReviewArrays(userId);
  if (userId) states.delete(userId);
  else states.clear();
}
