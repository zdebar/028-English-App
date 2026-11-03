import { useCallback } from 'react';
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
  entry: PracticeDeckEntry | null,
): UseReviewEntryDetailsResult {
  const item = entry?.item ?? null;
  const note = entry?.note ?? null;
  const grammar = entry?.grammar ?? null;

  const ensureDetailLoaded = useCallback((detail: PracticeDetail): Promise<boolean> => {
    return Promise.resolve(isDetailAvailable(detail, item));
  }, [item]);

  return {
    note,
    grammar,
    noteAvailable: typeof item?.note_id === 'number' && item.note_id > 0,
    grammarAvailable: item?.is_vocabulary === 0,
    noteLoadFailed: false,
    grammarLoadFailed: false,
    ensureDetailLoaded,
  };
}

function isDetailAvailable(
  detail: PracticeDetail,
  item: PracticeDeckEntry['item'] | null,
): boolean {
  if (!item) return false;
  return detail === 'note' || item.is_vocabulary === 0;
}
