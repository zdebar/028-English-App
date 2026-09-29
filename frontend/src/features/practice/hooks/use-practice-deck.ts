import { usePracticeAvailabilityBoundary } from './use-practice-availability-boundary';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { PracticeDeckEntry, PracticeOutcome, UserItemLocal } from '@/types/user-item.types';
import type { ReviewKind } from '@/types/practice.types';
import { useFetch } from '@/hooks/use-fetch';
import UserItem from '@/database/models/user-items';
import { reportError } from '@/features/logging/monitoring-handler';
import { NBSP } from './use-hint';
import { usePracticeCardState } from './use-practice-card-state';
import {
  answerCurrentReviewItem,
  createReviewQueue,
  getCurrentReviewEntry,
  getRemainingReviewEntries,
  type ReviewQueue,
} from '../review-queue';
import {
  invalidateReviewArrays,
  publishReviewItems,
  rebuildReviewArrays,
} from '../review-prefetch';
import {
  loadReviewDeckData,
  loadReviewEntryDetails,
  type ReviewEntryDetails,
  type ReviewDeckData,
} from '@/database/utils/practice-content.utils';
import type { PracticeDetail } from '../PracticeSessionCard';

type SecondaryContentRequest = Readonly<{
  userId: string;
  itemKey: string;
  promise: Promise<ReviewEntryDetails>;
}>;

type ReviewRetryAction = 'save';

type MutableRef<T> = { current: T };

function getReviewQueueEntries(reviewDeck: ReviewDeckData): readonly PracticeDeckEntry[] {
  return reviewDeck.prefetchedEntries ?? reviewDeck.entries;
}

function isReviewQueueFinished(queue: ReviewQueue | null): boolean {
  if (!queue) return false;
  return getCurrentReviewEntry(queue) === null;
}

function getInitialCompletedCount(queue: ReviewQueue | null): number {
  return queue ? queue.completedCount : 0;
}

function getInitialActiveItemCount(queue: ReviewQueue | null): number | null {
  return queue ? queue.activeItemCount : null;
}

function initializeReviewQueue(
  initialData: ReviewDeckData | undefined,
  queueRef: MutableRef<ReviewQueue | null>,
  dataRef: MutableRef<ReviewDeckData | null>,
): ReviewQueue | null {
  if (initialData && dataRef.current === null) {
    dataRef.current = initialData;
    queueRef.current = createReviewQueue(getReviewQueueEntries(initialData));
  }
  return queueRef.current;
}

function resetReviewDeckOnUserChange(
  previousUserIdRef: MutableRef<string | null>,
  userId: string | null,
  reset: () => void,
): void {
  if (previousUserIdRef.current === userId) return;
  previousUserIdRef.current = userId;
  reset();
}

function getReviewDeckCleanup(
  userId: string | null,
  queueRef: MutableRef<ReviewQueue | null>,
  finalEntryRef: MutableRef<PracticeDeckEntry | null>,
  dataRef: MutableRef<ReviewDeckData | null>,
): (() => void) | undefined {
  if (!userId) return undefined;
  return () => {
    queueRef.current = null;
    finalEntryRef.current = null;
    dataRef.current = null;
  };
}

/** Uses the prefetched review queue and persists each answer without blocking card changes. */
export function usePracticeDeck(userId: string | null, initialData?: ReviewDeckData) {
  const [saveError, setSaveError] = useState<Error | null>(null);
  const pendingProgressRef = useRef(new Map<number, UserItemLocal>());
  const pendingSaveRef = useRef(new Map<number, Promise<boolean>>());
  const saveReviewItem = useCallback(
    (item: UserItemLocal): Promise<boolean> => {
      if (!userId) return Promise.resolve(false);

      const existingSave = pendingSaveRef.current.get(item.item_id);
      if (existingSave) return existingSave;

      const savePromise = Promise.resolve()
        .then(() => UserItem.savePracticeDeck([item]))
        .then(() => {
          invalidateReviewArrays(item.user_id);
          if (pendingProgressRef.current.get(item.item_id) === item) {
            pendingProgressRef.current.delete(item.item_id);
          }
          if (pendingProgressRef.current.size === 0) setSaveError(null);
          return true;
        })
        .catch((caughtError: unknown) => {
          const normalizedError = toError(caughtError);
          setSaveError(normalizedError);
          reportError('Failed to save review progress', normalizedError);
          return false;
        });

      pendingSaveRef.current.set(item.item_id, savePromise);
      const removeSave = () => {
        if (pendingSaveRef.current.get(item.item_id) === savePromise) {
          pendingSaveRef.current.delete(item.item_id);
        }
      };
      void savePromise.then(removeSave, removeSave);
      return savePromise;
    },
    [userId],
  );
  const flushPendingReviewItems = useCallback(async (): Promise<boolean> => {
    if (!userId) return false;

    for (const item of pendingProgressRef.current.values()) {
      void saveReviewItem(item);
    }

    const saves = [...pendingSaveRef.current.values()];
    if (saves.length === 0) return pendingProgressRef.current.size === 0;

    const results = await Promise.all(saves);
    return results.every(Boolean) && pendingProgressRef.current.size === 0;
  }, [saveReviewItem, userId]);

  const [queueVersion, setQueueVersion] = useState(0);
  const initialReviewDeck = initialData;
  const reviewQueueRef = useRef<ReviewQueue | null>(null);
  const finalEntryRef = useRef<PracticeDeckEntry | null>(null);
  const queueDataRef = useRef<ReviewDeckData | null>(null);
  const initialQueue = initializeReviewQueue(initialReviewDeck, reviewQueueRef, queueDataRef);
  const flushPracticeForBoundary = useCallback(async (): Promise<void> => {
    const didSave = await flushPendingReviewItems();
    if (!userId) return;
    if (!didSave) {
      invalidateReviewArrays(userId);
      return;
    }

    const queue = reviewQueueRef.current;
    if (queue) {
      publishReviewItems(
        userId,
        getReviewKind(queueDataRef.current),
        getRemainingReviewEntries(queue).map((entry) => entry.item),
      );
    }
    globalThis.setTimeout(() => {
      void rebuildReviewArrays(userId).catch((error) => {
        reportError('Failed to rebuild review arrays', error);
      });
    }, 0);
  }, [flushPendingReviewItems, userId]);
  const { finishPractice } = usePracticeAvailabilityBoundary(userId, flushPracticeForBoundary);
  const [revealed, setRevealed] = useState(false);
  const [finishedReview, setFinishedReview] = useState(() => isReviewQueueFinished(initialQueue));
  const [retryAction, setRetryAction] = useState<ReviewRetryAction | null>(null);
  const [completedCount, setCompletedCount] = useState(getInitialCompletedCount(initialQueue));
  const [totalCount, setTotalCount] = useState(getInitialActiveItemCount(initialQueue));
  const isTransitioningRef = useRef(false);
  const [secondaryContent, setSecondaryContent] = useState<SecondaryContent | null>(null);
  const secondaryContentRequestIdRef = useRef(0);
  const secondaryContentRequestRef = useRef<SecondaryContentRequest | null>(null);

  const getSecondaryContentPromise = useCallback(
    (requestedUserId: string, item: PracticeDeckEntry['item']): Promise<ReviewEntryDetails> => {
      const itemKey = getReviewItemKey(item);
      const existingRequest = secondaryContentRequestRef.current;
      if (existingRequest?.userId === requestedUserId && existingRequest.itemKey === itemKey) {
        return existingRequest.promise;
      }

      const promise = loadReviewEntryDetails(requestedUserId, item);
      secondaryContentRequestRef.current = { userId: requestedUserId, itemKey, promise };
      return promise;
    },
    [],
  );

  const reviewKind = getReviewKind(initialData);
  const fetchPracticeDeck = useCallback(
    () => (userId ? loadReviewDeckData(userId, reviewKind) : Promise.resolve(createEmptyReviewDeck(reviewKind))),
    [reviewKind, userId],
  );
  const { data: fetchedResult, loading, error } = useFetch<ReviewDeckData>(fetchPracticeDeck, {
    initialData: initialReviewDeck,
  });
  const { currentEntry, currentItem } = useMemo(
    () => {
      const queueEntry = getCurrentReviewEntry(reviewQueueRef.current);
      const entry = finishedReview ? null : queueEntry ?? finalEntryRef.current;
      return { currentEntry: entry, currentItem: entry?.item ?? null };
    },
    [finishedReview, queueVersion],
  );
  const cardState = usePracticeCardState({
    currentItem,
    revealed,
    isCompletion: finishedReview,
    setRevealed,
  });
  const resetQuestionState = cardState.resetQuestionState;

  const previousUserIdRef = useRef(userId);
  useEffect(() => {
    resetReviewDeckOnUserChange(previousUserIdRef, userId, () => {
      pendingProgressRef.current.clear();
      pendingSaveRef.current.clear();
      reviewQueueRef.current = null;
      finalEntryRef.current = null;
      queueDataRef.current = null;
      setQueueVersion(0);
      setCompletedCount(0);
      setTotalCount(null);
      setFinishedReview(false);
    });

    return getReviewDeckCleanup(userId, reviewQueueRef, finalEntryRef, queueDataRef);
  }, [userId]);

  useEffect(() => {
    if (loading || !fetchedResult || queueDataRef.current === fetchedResult) return;

    const queue = createReviewQueue(getReviewQueueEntries(fetchedResult));
    queueDataRef.current = fetchedResult;
    reviewQueueRef.current = queue;
    finalEntryRef.current = null;
    setCompletedCount(queue.completedCount);
    setTotalCount(queue.activeItemCount);
    setFinishedReview(getCurrentReviewEntry(queue) === null);
    setRetryAction(null);
    resetQuestionState();
    setQueueVersion((version) => version + 1);
  }, [fetchedResult, loading, resetQuestionState]);

  useEffect(() => {
    if (!finishedReview || !reviewQueueRef.current) return;
    void finishPractice();
  }, [finishPractice, finishedReview, queueVersion]);

  useEffect(() => {
    if (!userId || !currentItem) {
      setSecondaryContent(null);
      return undefined;
    }

    const requestId = ++secondaryContentRequestIdRef.current;
    let isActive = true;
    const itemKey = getReviewItemKey(currentItem);
    const detailPromise = getSecondaryContentPromise(userId, currentItem);

    void detailPromise
      .then((details) => {
        if (!isActive || requestId !== secondaryContentRequestIdRef.current) return;
        setSecondaryContent({ itemKey, ...details });
      })
      .catch((caughtError: unknown) => {
        if (!isActive || requestId !== secondaryContentRequestIdRef.current) return;
        reportError('Failed to load practice card details', toError(caughtError));
        setSecondaryContent({
          itemKey,
          note: null,
          grammar: null,
          noteLoadFailed: hasPositiveReference(currentItem.note_id),
          grammarLoadFailed: hasPositiveReference(currentItem.grammar_chunk_id),
        });
      });

    return () => {
      isActive = false;
      if (requestId === secondaryContentRequestIdRef.current) {
        secondaryContentRequestIdRef.current += 1;
      }
      if (secondaryContentRequestRef.current?.promise === detailPromise) {
        secondaryContentRequestRef.current = null;
      }
    };
  }, [currentItem, getSecondaryContentPromise, userId]);

  const ensureDetailLoaded = useCallback(
    async (detail: PracticeDetail): Promise<boolean> => {
      if (!userId || !currentItem) return false;

      const itemKey = getReviewItemKey(currentItem);
      if (secondaryContent?.itemKey === itemKey) {
        return !getDetailLoadFailed(secondaryContent, detail);
      }

      try {
        const details = await getSecondaryContentPromise(userId, currentItem);
        return !getDetailLoadFailed(details, detail);
      } catch {
        return false;
      }
    },
    [currentItem, getSecondaryContentPromise, secondaryContent, userId],
  );

  const nextItem = useCallback(
    async (outcome: PracticeOutcome) => {
      if (isTransitioningRef.current) return;
      isTransitioningRef.current = true;

      try {
        if (!currentItem || !userId || !reviewQueueRef.current) return;

        const updatedItem = UserItem.applyPracticeProgress(
          currentItem,
          outcome,
          new Date(Date.now()).toISOString(),
        );
        pendingProgressRef.current.set(updatedItem.item_id, updatedItem);
        void saveReviewItem(updatedItem);

        const answerResult = answerCurrentReviewItem(reviewQueueRef.current, updatedItem);
        if (!answerResult) return;

        setCompletedCount(reviewQueueRef.current.completedCount);
        setTotalCount(reviewQueueRef.current.activeItemCount);
        setQueueVersion((version) => version + 1);

        if (answerResult.hasNextItem) {
          resetQuestionState();
          return;
        }

        finalEntryRef.current = answerResult.answeredEntry;
        setQueueVersion((version) => version + 1);
        const didSave = await flushPendingReviewItems();
        if (!didSave) {
          setRetryAction('save');
          return;
        }

        finalEntryRef.current = null;
        setFinishedReview(true);
        setRetryAction(null);
      } finally {
        isTransitioningRef.current = false;
      }
    },
    [
      currentItem,
      flushPendingReviewItems,
      resetQuestionState,
      saveReviewItem,
      userId,
    ],
  );
  const retryPractice = useCallback(async () => {
    if (!retryAction || isTransitioningRef.current) return;
    isTransitioningRef.current = true;

    try {
      const didSave = await flushPendingReviewItems();
      if (!didSave) return;

      finalEntryRef.current = null;
      setFinishedReview(true);
      setRetryAction(null);
    } finally {
      isTransitioningRef.current = false;
    }
  }, [flushPendingReviewItems, retryAction]);

  return {
    currentItem,
    note: getSecondaryNote(currentEntry, secondaryContent),
    grammar: getSecondaryGrammar(currentEntry, secondaryContent),
    noteAvailable: hasPositiveReference(currentItem?.note_id),
    grammarAvailable: hasPositiveReference(currentItem?.grammar_chunk_id),
    noteLoadFailed: getSecondaryNoteLoadFailed(currentEntry, secondaryContent),
    grammarLoadFailed: getSecondaryGrammarLoadFailed(currentEntry, secondaryContent),
    ensureDetailLoaded,
    progressLabel: getReviewProgressLabel(completedCount, totalCount),
    finishedReview,
    revealed,
    setRevealed,
    czech: cardState.czech,
    english: cardState.english,
    pronunciation: getReviewPronunciation(currentItem, revealed),
    audio: currentItem?.audio ?? null,
    audioDisabled: cardState.audioDisabled,
    handleReveal: cardState.handleReveal,
    plusHint: cardState.plusHint,
    nextItem,
    retryPractice: retryAction ? retryPractice : undefined,
    loading,
    error: error ?? saveError,
    finishPractice,
    audioError: cardState.audioError,
    playAudio: cardState.playAudio,
    audioLoading: cardState.audioLoading,
    isPlaying: cardState.isPlaying,
  };
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

function createEmptyReviewDeck(reviewKind: ReviewKind): ReviewDeckData {
  return {
    entries: [],
    availabilityCheckedAt: new Date().toISOString(),
    abandoned: true,
    reviewKind,
  };
}

function getReviewKind(initialData: ReviewDeckData | null | undefined): ReviewKind {
  return initialData?.reviewKind ?? 'grammar';
}

function getReviewProgressLabel(completedCount: number, totalCount: number | null): string {
  if (totalCount === null) return String(completedCount);
  return `${completedCount} / ${totalCount}`;
}

type SecondaryContent = Readonly<{
  itemKey: string;
  note: PracticeDeckEntry['note'];
  grammar: PracticeDeckEntry['grammar'];
  noteLoadFailed: boolean;
  grammarLoadFailed: boolean;
}>;

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
  if (secondaryContent?.itemKey === getReviewItemKey(entry.item)) {
    return secondaryContent.note;
  }
  return entry.note ?? null;
}

function getSecondaryGrammar(
  entry: PracticeDeckEntry | null,
  secondaryContent: SecondaryContent | null,
): PracticeDeckEntry['grammar'] | null {
  if (!entry) return null;
  if (secondaryContent?.itemKey === getReviewItemKey(entry.item)) {
    return secondaryContent.grammar;
  }
  return entry.grammar ?? null;
}

function getSecondaryNoteLoadFailed(
  entry: PracticeDeckEntry | null,
  secondaryContent: SecondaryContent | null,
): boolean {
  if (!entry || secondaryContent?.itemKey !== getReviewItemKey(entry.item)) return false;
  return secondaryContent.noteLoadFailed ?? false;
}

function getSecondaryGrammarLoadFailed(
  entry: PracticeDeckEntry | null,
  secondaryContent: SecondaryContent | null,
): boolean {
  if (!entry || secondaryContent?.itemKey !== getReviewItemKey(entry.item)) return false;
  return secondaryContent.grammarLoadFailed ?? false;
}

function getReviewPronunciation(
  currentItem: PracticeDeckEntry['item'] | null,
  revealed: boolean,
): string {
  if (!revealed) return NBSP;
  return currentItem?.pronunciation || NBSP;
}
