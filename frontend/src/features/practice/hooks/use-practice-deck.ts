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
  type ReviewQueue,
} from '../review-queue';
import {
  invalidateReviewArrays,
  rebuildReviewArrays,
  syncReviewItemToCache,
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

function getInitialSessionTotalCount(queue: ReviewQueue | null): number | null {
  return queue ? queue.sessionTotalCount : null;
}

function initializeReviewQueue(
  initialData: ReviewDeckData | undefined,
  reviewKind: ReviewKind,
  queueRef: MutableRef<ReviewQueue | null>,
  dataRef: MutableRef<ReviewDeckData | null>,
): ReviewQueue | null {
  if (initialData && dataRef.current === null) {
    dataRef.current = initialData;
    queueRef.current = createReviewQueue(getReviewQueueEntries(initialData), reviewKind);
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
  dataRef: MutableRef<ReviewDeckData | null>,
): (() => void) | undefined {
  if (!userId) return undefined;
  return () => {
    queueRef.current = null;
    dataRef.current = null;
  };
}

/** Uses the prefetched review queue and persists each answer before advancing. */
export function usePracticeDeck(userId: string | null, initialData?: ReviewDeckData) {
  const [saveError, setSaveError] = useState<Error | null>(null);
  const saveReviewItem = useCallback(
    async (item: UserItemLocal): Promise<boolean> => {
      if (!userId) return false;

      try {
        await UserItem.savePracticeDeck([item]);
      } catch (caughtError: unknown) {
        const normalizedError = toError(caughtError);
        setSaveError(normalizedError);
        reportError('Failed to save review progress', normalizedError);
        return false;
      }

      try {
        await syncReviewItemToCache(userId, item);
      } catch (caughtError: unknown) {
        invalidateReviewArrays(userId);
        void rebuildReviewArrays(userId).catch((rebuildError: unknown) => {
          reportError('Failed to rebuild review arrays', rebuildError);
        });
        reportError('Failed to update review cache', caughtError);
      }

      setSaveError(null);
      return true;
    },
    [userId],
  );

  const [queueVersion, setQueueVersion] = useState(0);
  const initialReviewDeck = initialData;
  const reviewKind = getReviewKind(initialData);
  const reviewQueueRef = useRef<ReviewQueue | null>(null);
  const queueDataRef = useRef<ReviewDeckData | null>(null);
  const pendingAnswerRef = useRef<UserItemLocal | null>(null);
  const initialQueue = initializeReviewQueue(
    initialReviewDeck,
    reviewKind,
    reviewQueueRef,
    queueDataRef,
  );
  const { finishPractice } = usePracticeAvailabilityBoundary(userId);
  const [revealed, setRevealed] = useState(false);
  const [finishedReview, setFinishedReview] = useState(() => isReviewQueueFinished(initialQueue));
  const [retryAction, setRetryAction] = useState<ReviewRetryAction | null>(null);
  const [completedCount, setCompletedCount] = useState(getInitialCompletedCount(initialQueue));
  const [totalCount, setTotalCount] = useState(getInitialSessionTotalCount(initialQueue));
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
      const entry = finishedReview ? null : queueEntry;
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
      pendingAnswerRef.current = null;
      reviewQueueRef.current = null;
      queueDataRef.current = null;
      setQueueVersion(0);
      setCompletedCount(0);
      setTotalCount(null);
      setFinishedReview(false);
    });

    return getReviewDeckCleanup(userId, reviewQueueRef, queueDataRef);
  }, [userId]);

  useEffect(() => {
    if (loading || !fetchedResult || queueDataRef.current === fetchedResult) return;

    const queue = createReviewQueue(getReviewQueueEntries(fetchedResult), reviewKind);
    queueDataRef.current = fetchedResult;
    reviewQueueRef.current = queue;
    setCompletedCount(queue.completedCount);
    setTotalCount(queue.sessionTotalCount);
    setFinishedReview(getCurrentReviewEntry(queue) === null);
    setRetryAction(null);
    resetQuestionState();
    setQueueVersion((version) => version + 1);
  }, [fetchedResult, loading, resetQuestionState, reviewKind]);

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

  const persistAndAdvance = useCallback(
    async (updatedItem: UserItemLocal): Promise<void> => {
      const queue = reviewQueueRef.current;
      if (!queue) return;

      const didSave = await saveReviewItem(updatedItem);
      if (!didSave) {
        pendingAnswerRef.current = updatedItem;
        setRetryAction('save');
        return;
      }

      const answerResult = answerCurrentReviewItem(queue, updatedItem);
      if (!answerResult) return;

      pendingAnswerRef.current = null;
      setRetryAction(null);

      if (answerResult.hasNextItem) {
        setCompletedCount(queue.completedCount);
        setTotalCount(queue.sessionTotalCount);
        setQueueVersion((version) => version + 1);
        resetQuestionState();
        return;
      }

      setFinishedReview(true);
    },
    [resetQuestionState, saveReviewItem],
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
        await persistAndAdvance(updatedItem);
      } finally {
        isTransitioningRef.current = false;
      }
    },
    [
      currentItem,
      persistAndAdvance,
      userId,
    ],
  );
  const retryPractice = useCallback(async () => {
    const pendingItem = pendingAnswerRef.current;
    if (!retryAction || !pendingItem || isTransitioningRef.current) return;
    isTransitioningRef.current = true;

    try {
      await persistAndAdvance(pendingItem);
    } finally {
      isTransitioningRef.current = false;
    }
  }, [persistAndAdvance, retryAction]);

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
