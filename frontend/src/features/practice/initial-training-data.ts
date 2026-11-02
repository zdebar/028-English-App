import { ensureDataManagerReady, dataManagerStore } from '@/database/state/data-store';
import {
  selectHasStartedLessonToday,
  selectPreparedInitialLesson,
  selectReviewAvailability,
} from '@/database/state/data-selectors';
import type { PreparedInitialLesson } from '@/database/state/data-types';
import { hasReachedReviewLimit } from './practice-availability';

export type InitialTrainingData = PreparedInitialLesson;

/** Resolves initial-training content and eligibility from the central dataset. */
export async function loadInitialTrainingData(userId: string): Promise<InitialTrainingData> {
  await ensureDataManagerReady(userId);
  const state = dataManagerStore.getState();
  if (state.userId !== userId || state.status !== 'ready') {
    throw state.error ?? new Error('Application data is not ready for initial training.');
  }

  const prepared = selectPreparedInitialLesson(state, userId);
  if (!prepared?.lesson) return emptyInitialTrainingData();

  const now = new Date(state.nowIso);
  const continuingLesson = selectHasStartedLessonToday(state, userId, prepared.lesson.id, now);
  if (!continuingLesson && hasReachedReviewLimit(selectReviewAvailability(state, userId, state.nowIso))) {
    return emptyInitialTrainingData();
  }
  return prepared;
}

function emptyInitialTrainingData(): InitialTrainingData {
  return { lesson: null, items: [], entries: [], grammar: null, grammarGroup: null };
}
