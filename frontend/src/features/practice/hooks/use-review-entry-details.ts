import { useCallback, useEffect, useRef, useState } from 'react';
import type { PracticeDetail } from '../practice-session-card.types';
import type { PracticeDeckEntry } from '@/types/user-item.types';
import {
  loadReviewEntryDetails,
  type ReviewEntryDetails,
} from '@/database/practice/practice-content';
import { reportError } from '@/features/logging/logging-handler';
import { toError } from '@/utils/error.utils';

type SecondaryContentRequest = Readonly<{
  userId: string;
  itemKey: string;
  promise: Promise<ReviewEntryDetails>;
}>;

type SecondaryContent = ReviewEntryDetails & Readonly<{ itemKey: string }>;

type UseReviewEntryDetailsResult = Readonly<{
  note: PracticeDeckEntry['note'] | null;
  grammar: PracticeDeckEntry['grammar'] | null;
  noteAvailable: boolean;
  grammarAvailable: boolean;
  noteLoadFailed: boolean;
  grammarLoadFailed: boolean;
  ensureDetailLoaded: (detail: PracticeDetail) => Promise<boolean>;
}>;

/** Loads and shares optional details for the currently selected review card. */
export function useReviewEntryDetails(
  userId: string | null,
  entry: PracticeDeckEntry | null,
): UseReviewEntryDetailsResult {
  const item = entry?.item ?? null;
  const [secondaryContent, setSecondaryContent] = useState<SecondaryContent | null>(null);
  const requestIdRef = useRef(0);
  const requestRef = useRef<SecondaryContentRequest | null>(null);

  const getDetailsPromise = useCallback(
    (requestedUserId: string, requestedItem: PracticeDeckEntry['item']): Promise<ReviewEntryDetails> => {
      const itemKey = getReviewItemKey(requestedItem);
      const existingRequest = requestRef.current;
      if (existingRequest?.userId === requestedUserId && existingRequest.itemKey === itemKey) {
        return existingRequest.promise;
      }

      const promise = loadReviewEntryDetails(requestedUserId, requestedItem);
      requestRef.current = { userId: requestedUserId, itemKey, promise };
      return promise;
    },
    [],
  );

  useEffect(() => {
    if (!userId || !item) {
      setSecondaryContent(null);
      return undefined;
    }

    const requestId = ++requestIdRef.current;
    let isActive = true;
    const itemKey = getReviewItemKey(item);
    const detailPromise = getDetailsPromise(userId, item);

    void detailPromise
      .then((details) => {
        if (!isActive || requestId !== requestIdRef.current) return;
        setSecondaryContent({ itemKey, ...details });
      })
      .catch((caughtError: unknown) => {
        if (!isActive || requestId !== requestIdRef.current) return;
        reportError('Failed to load practice card details', toError(caughtError));
        setSecondaryContent({
          itemKey,
          note: null,
          grammar: null,
          noteLoadFailed: hasPositiveReference(item.note_id),
          grammarLoadFailed: item.is_vocabulary === 0,
        });
      });

    return () => {
      isActive = false;
      if (requestId === requestIdRef.current) requestIdRef.current += 1;
      if (requestRef.current?.promise === detailPromise) requestRef.current = null;
    };
  }, [getDetailsPromise, item, userId]);

  const ensureDetailLoaded = useCallback(
    async (detail: PracticeDetail): Promise<boolean> => {
      if (!userId || !item) return false;

      const itemKey = getReviewItemKey(item);
      if (secondaryContent?.itemKey === itemKey) {
        return !getDetailLoadFailed(secondaryContent, detail);
      }

      try {
        const details = await getDetailsPromise(userId, item);
        return !getDetailLoadFailed(details, detail);
      } catch {
        return false;
      }
    },
    [getDetailsPromise, item, secondaryContent, userId],
  );

  return {
    note: getSecondaryNote(entry, secondaryContent),
    grammar: getSecondaryGrammar(entry, secondaryContent),
    noteAvailable: hasPositiveReference(item?.note_id),
    grammarAvailable: item?.is_vocabulary === 0,
    noteLoadFailed: getSecondaryNoteLoadFailed(entry, secondaryContent),
    grammarLoadFailed: getSecondaryGrammarLoadFailed(entry, secondaryContent),
    ensureDetailLoaded,
  };
}

function hasPositiveReference(value: number | null | undefined): boolean {
  return typeof value === 'number' && value > 0;
}

function getReviewItemKey(item: PracticeDeckEntry['item']): string {
  return String(item.item_id);
}

function getDetailLoadFailed(
  details: Pick<SecondaryContent, 'noteLoadFailed' | 'grammarLoadFailed'>,
  detail: PracticeDetail,
): boolean {
  if (detail === 'note') return details.noteLoadFailed;
  return details.grammarLoadFailed;
}

function getSecondaryNote(
  entry: PracticeDeckEntry | null,
  secondaryContent: SecondaryContent | null,
): PracticeDeckEntry['note'] | null {
  if (!entry) return null;
  if (secondaryContent?.itemKey === getReviewItemKey(entry.item)) return secondaryContent.note;
  return entry.note ?? null;
}

function getSecondaryGrammar(
  entry: PracticeDeckEntry | null,
  secondaryContent: SecondaryContent | null,
): PracticeDeckEntry['grammar'] | null {
  if (!entry) return null;
  if (secondaryContent?.itemKey === getReviewItemKey(entry.item)) return secondaryContent.grammar;
  return entry.grammar ?? null;
}

function getSecondaryNoteLoadFailed(
  entry: PracticeDeckEntry | null,
  secondaryContent: SecondaryContent | null,
): boolean {
  if (!entry || secondaryContent?.itemKey !== getReviewItemKey(entry.item)) return false;
  return secondaryContent.noteLoadFailed;
}

function getSecondaryGrammarLoadFailed(
  entry: PracticeDeckEntry | null,
  secondaryContent: SecondaryContent | null,
): boolean {
  if (!entry || secondaryContent?.itemKey !== getReviewItemKey(entry.item)) return false;
  return secondaryContent.grammarLoadFailed;
}
