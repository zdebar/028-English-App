import { useCallback } from 'react';
import { useDataManager } from '@/database/state/data-store';
import { selectPracticeGrammarContext } from '@/database/state/data-selectors';
import type { DataManagerState } from '@/database/state/data-types';
import type { PracticeDetail } from '../practice-session-card.types';
import type { PracticeDeckEntry } from '@/types/user-item.types';

type UseReviewEntryDetailsResult = Readonly<{
  note: PracticeDeckEntry['note'] | null;
  grammar: PracticeDeckEntry['grammar'] | null;
  noteAvailable: boolean;
  grammarAvailable: boolean;
  noteLoadFailed: boolean;
  grammarLoadFailed: boolean;
  ensureDetailLoaded: (detail: PracticeDetail) => Promise<boolean>;
}>;

/** Selects optional practice-card content from the already-loaded central dataset. */
export function useReviewEntryDetails(
  userId: string | null,
  entry: PracticeDeckEntry | null,
): UseReviewEntryDetailsResult {
  const state = useDataManager((current) => current);
  const item = entry?.item ?? null;
  const note = selectEntryNote(state.notes, item);
  const grammar = selectEntryGrammar(state, userId, item);
  const isReady = isDataReady(state.userId, state.status, userId);

  const ensureDetailLoaded = useCallback((detail: PracticeDetail): Promise<boolean> => {
    return Promise.resolve(isDetailAvailable(detail, isReady, item));
  }, [isReady, item]);

  return {
    note,
    grammar,
    noteAvailable: hasEntryNote(item),
    grammarAvailable: item?.is_vocabulary === 0,
    noteLoadFailed: false,
    grammarLoadFailed: false,
    ensureDetailLoaded,
  };
}

function selectEntryNote(
  notes: DataManagerState['notes'],
  item: PracticeDeckEntry['item'] | null,
) {
  return item ? notes.find((candidate) => candidate.id === item.note_id) ?? null : null;
}

function selectEntryGrammar(
  state: DataManagerState,
  userId: string | null,
  item: PracticeDeckEntry['item'] | null,
) {
  if (!item || !userId) return null;
  const groupId = state.lessons.find((lesson) => lesson.id === item.lesson_id)?.group_id;
  return selectPracticeGrammarContext(state, userId, groupId).grammar;
}

function isDataReady(
  dataUserId: string | null,
  status: DataManagerState['status'],
  userId: string | null,
): boolean {
  return Boolean(userId) && dataUserId === userId && status === 'ready';
}

function isDetailAvailable(
  detail: PracticeDetail,
  isReady: boolean,
  item: PracticeDeckEntry['item'] | null,
): boolean {
  if (!isReady || !item) return false;
  return detail === 'note' || item.is_vocabulary === 0;
}

function hasEntryNote(item: PracticeDeckEntry['item'] | null): boolean {
  return typeof item?.note_id === 'number' && item.note_id > 0;
}
