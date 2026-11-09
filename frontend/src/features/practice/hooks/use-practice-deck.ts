import { usePracticeAvailabilityBoundary } from './use-practice-availability-boundary';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { PracticeDeckEntry, PracticeOutcome, UserItemLocal } from '@/types/user-item.types';
import type { ReviewDirection, ReviewKind } from '@/types/practice.types';
import { ensureDataPackage } from '@/database/state/data-store';
import { useCurrentUserDataPackage } from '@/database/state/use-current-user-data-package';
import type { ReviewAvailability, ReviewDeckData, ReviewPracticePackage } from '@/database/state/data-types';
import UserItem from '@/database/models/user-items';
import { reportError } from '@/features/logging/logging-handler';
import { toError } from '@/utils/error.utils';
import { NBSP } from './use-hint';
import { usePracticeCardState } from './use-practice-card-state';
import {
  answerCurrentReviewItem,
  createReviewQueue,
  getCurrentReviewEntry,
  type ReviewQueue,
  type ReviewQueueAnswerResult,
} from '../review-queue';
import { useReviewEntryDetails } from './use-review-entry-details';

// -- Review-session action types --
type ReviewRetryAction = 'save';

type PracticeCompletionHandler = () => void;

type MutableRef<T> = { current: T };
type StateSetter<T> = (value: T | ((current: T) => T)) => void;

type ContinueAnsweredQueueOptions = {
  answerResult: ReviewQueueAnswerResult;
  queue: ReviewQueue;
  activeDirectionRef: MutableRef<ReviewDirection>;
  reviewQueueRef: MutableRef<ReviewQueue | null>;
  queueDataRef: MutableRef<ReviewDeckData | null>;
  completedOffsetRef: MutableRef<number>;
  setCompletedCount: StateSetter<number>;
  setTotalCount: StateSetter<number | null>;
  availableDueCount: number | null;
  reviewPackage: ReviewPracticePackage;
  reviewDirection: ReviewDirection | undefined;
  setFinishedReview: StateSetter<boolean>;
  setRetryAction: StateSetter<ReviewRetryAction | null>;
  setQueueVersion: StateSetter<number>;
  resetQuestionState: () => void;
  completePractice: () => Promise<void>;
};

type StartDirectionDeckOptions = {
  deck: ReviewDeckData;
  queueRef: MutableRef<ReviewQueue | null>;
  dataRef: MutableRef<ReviewDeckData | null>;
  directionRef: MutableRef<ReviewDirection>;
  update: (queue: ReviewQueue) => void;
  setFinishedReview: (finished: boolean) => void;
  setRetryAction: (action: ReviewRetryAction | null) => void;
  setQueueVersion: (update: (version: number) => number) => void;
  resetQuestionState: () => void;
};

type ApplyFetchedReviewDeckOptions = Readonly<{
  loading: boolean;
  fetchedResult: ReviewDeckData | null;
  processedDeckDataRef: MutableRef<ReviewDeckData | null>;
  queueDataRef: MutableRef<ReviewDeckData | null>;
  reviewQueueRef: MutableRef<ReviewQueue | null>;
  activeDirectionRef: MutableRef<ReviewDirection>;
  completedOffsetRef: MutableRef<number>;
  reviewKind: ReviewKind;
  setCompletedCount: StateSetter<number>;
  setTotalCount: StateSetter<number | null>;
  setFinishedReview: StateSetter<boolean>;
  setRetryAction: StateSetter<ReviewRetryAction | null>;
  resetQuestionState: () => void;
  setQueueVersion: StateSetter<number>;
}>;

type PersistAndAdvanceReviewItemOptions = Readonly<{
  updatedItem: UserItemLocal;
  userId: string | null;
  reviewKind: ReviewKind;
  reviewDirection: ReviewDirection | undefined;
  saveReviewItem: (item: UserItemLocal) => Promise<boolean>;
  pendingAnswerRef: MutableRef<UserItemLocal | null>;
  setSaveError: SaveErrorSetter;
  setRetryAction: StateSetter<ReviewRetryAction | null>;
  reviewQueueRef: MutableRef<ReviewQueue | null>;
  activeDirectionRef: MutableRef<ReviewDirection>;
  queueDataRef: MutableRef<ReviewDeckData | null>;
  completedOffsetRef: MutableRef<number>;
  setCompletedCount: StateSetter<number>;
  setTotalCount: StateSetter<number | null>;
  setQueueVersion: StateSetter<number>;
  setFinishedReview: StateSetter<boolean>;
  resetQuestionState: () => void;
  completePractice: () => Promise<void>;
}>;

type AnswerNextReviewItemOptions = Readonly<{
  outcome: PracticeOutcome;
  currentItem: UserItemLocal | null;
  userId: string | null;
  reviewQueueRef: MutableRef<ReviewQueue | null>;
  isTransitioningRef: MutableRef<boolean>;
  persistAndAdvance: (item: UserItemLocal) => Promise<void>;
}>;

type RetryPendingReviewItemOptions = Readonly<{
  retryAction: ReviewRetryAction | null;
  pendingAnswerRef: MutableRef<UserItemLocal | null>;
  isTransitioningRef: MutableRef<boolean>;
  persistAndAdvance: (item: UserItemLocal) => Promise<void>;
}>;

// -- Public review hook --
/** Uses the prefetched review queue and persists each answer before advancing. */
export function usePracticeDeck(
  userId: string | null,
  reviewKind: ReviewKind = 'grammar',
  onComplete?: PracticeCompletionHandler,
  reviewDirection?: ReviewDirection,
) {
  const [saveError, setSaveError] = useState<Error | null>(null);
  const saveReviewItem = useCallback(
    (item: UserItemLocal) => saveReviewItemForUser(userId, item, setSaveError),
    [userId],
  );

  const [queueVersion, setQueueVersion] = useState(0);
  const {
    data: reviewPackage,
    ready: dataReady,
    loading,
    error,
  } = useCurrentUserDataPackage(userId, { kind: 'review-practice', reviewKind });
  const initialReviewDeck = reviewDirection
    ? reviewPackage?.decks[reviewDirection]
    : reviewPackage?.initialDeck;
  const activeDirectionRef = useRef<ReviewDirection>(getInitialReviewDirection(initialReviewDeck));
  const reviewQueueRef = useRef<ReviewQueue | null>(null);
  const queueDataRef = useRef<ReviewDeckData | null>(null);
  const processedDeckDataRef = useRef<ReviewDeckData | null>(getInitialProcessedDeck(initialReviewDeck));
  const pendingAnswerRef = useRef<UserItemLocal | null>(null);
  const initialQueue = initializeReviewQueue(
    initialReviewDeck,
    reviewKind,
    reviewQueueRef,
    queueDataRef,
  );
  const { finishPractice } = usePracticeAvailabilityBoundary(userId);
  const completionHandledRef = useRef(false);
  const completePractice = useCallback(async () => {
    await completePracticeOnce(completionHandledRef, finishPractice, onComplete);
  }, [finishPractice, onComplete]);
  const [revealed, setRevealed] = useState(false);
  const [finishedReview, setFinishedReview] = useState(() => isReviewQueueFinished(initialQueue));
  const [retryAction, setRetryAction] = useState<ReviewRetryAction | null>(null);
  const [completedCount, setCompletedCount] = useState(getInitialCompletedCount(initialQueue));
  const [totalCount, setTotalCount] = useState(getAvailableReviewCount(initialReviewDeck, initialQueue));
  const completedOffsetRef = useRef(0);
  const isTransitioningRef = useRef(false);

  const fetchedResult = useMemo(
    () => getFetchedReviewDeck(dataReady, initialReviewDeck),
    [dataReady, initialReviewDeck],
  );
  const { currentEntry, currentItem } = useMemo(
    () => getVisibleReviewEntry(finishedReview, reviewQueueRef.current),
    [finishedReview, queueVersion],
  );
  const reviewEntryDetails = useReviewEntryDetails(currentEntry);
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
      processedDeckDataRef.current = null;
      setQueueVersion(0);
      setCompletedCount(0);
      setTotalCount(null);
      completedOffsetRef.current = 0;
      setFinishedReview(false);
    });

    return getReviewDeckCleanup(userId, reviewQueueRef, queueDataRef);
  }, [userId]);

  useEffect(() => {
    applyFetchedReviewDeck({
      loading,
      fetchedResult,
      processedDeckDataRef,
      queueDataRef,
      reviewQueueRef,
      activeDirectionRef,
      completedOffsetRef,
      reviewKind,
      setCompletedCount,
      setTotalCount,
      setFinishedReview,
      setRetryAction,
      resetQuestionState,
      setQueueVersion,
    });
  }, [fetchedResult, loading, resetQuestionState, reviewKind]);

  useEffect(() => {
    completeFinishedReview(finishedReview, reviewQueueRef.current, completePractice);
  }, [completePractice, finishedReview, queueVersion]);

  const persistAndAdvance = useCallback(
    (updatedItem: UserItemLocal) => persistAndAdvanceReviewItem({
      updatedItem,
      userId,
      reviewKind,
      reviewDirection,
      saveReviewItem,
      pendingAnswerRef,
      setSaveError,
      setRetryAction,
      reviewQueueRef,
      activeDirectionRef,
      queueDataRef,
      completedOffsetRef,
      setCompletedCount,
      setTotalCount,
      setQueueVersion,
      setFinishedReview,
      resetQuestionState,
      completePractice,
    }),
    [completePractice, resetQuestionState, reviewDirection, reviewKind, saveReviewItem, userId],
  );

  const nextItem = useCallback(
    (outcome: PracticeOutcome) => answerNextReviewItem({
      outcome,
      currentItem,
      userId,
      reviewQueueRef,
      isTransitioningRef,
      persistAndAdvance,
    }),
    [
      currentItem,
      persistAndAdvance,
      userId,
    ],
  );
  const retryPractice = useCallback(
    () => retryPendingReviewItem({
      retryAction,
      pendingAnswerRef,
      isTransitioningRef,
      persistAndAdvance,
    }),
    [persistAndAdvance, retryAction],
  );

  return {
    currentItem,
    soundGroups: getReviewSoundGroups(reviewPackage),
    note: reviewEntryDetails.note,
    grammar: reviewEntryDetails.grammar,
    noteAvailable: reviewEntryDetails.noteAvailable,
    grammarAvailable: reviewEntryDetails.grammarAvailable,
    noteLoadFailed: reviewEntryDetails.noteLoadFailed,
    grammarLoadFailed: reviewEntryDetails.grammarLoadFailed,
    ensureDetailLoaded: reviewEntryDetails.ensureDetailLoaded,
    progressLabel: getReviewProgressLabel(completedCount, totalCount),
    finishedReview,
    revealed,
    setRevealed,
    czech: cardState.czech,
    czechHintVisible: cardState.czechHintVisible,
    english: cardState.english,
    pronunciation: getReviewPronunciation(currentItem, revealed),
    audio: getReviewAudio(currentItem),
    audioDisabled: cardState.audioDisabled,
    handleReveal: cardState.handleReveal,
    plusHint: cardState.plusHint,
    nextItem,
    retryPractice: getRetryHandler(retryAction, retryPractice),
    loading,
    error: getPracticeError(error, saveError),
    finishPractice,
    audioError: cardState.audioError,
    playAudio: cardState.playAudio,
    audioLoading: cardState.audioLoading,
    isPlaying: cardState.isPlaying,
  };
}

// -- Package and presentation helpers --
type SaveErrorSetter = (error: Error | null) => void;

function getInitialProcessedDeck(deck: ReviewDeckData | undefined): ReviewDeckData | null {
  return deck ?? null;
}

function getInitialReviewDirection(deck: ReviewDeckData | undefined): ReviewDirection {
  return deck?.reviewDirection ?? 'cz_to_en';
}

function getFetchedReviewDeck(dataReady: boolean, deck: ReviewDeckData | undefined): ReviewDeckData | null {
  if (!dataReady) return null;
  return deck ?? null;
}

function getReviewSoundGroups(reviewPackage: ReviewPracticePackage | undefined) {
  return reviewPackage?.soundGroups ?? [];
}

function getReviewAudio(currentItem: PracticeDeckEntry['item'] | null) {
  return currentItem?.audio ?? null;
}

function getPracticeError(dataError: Error | null, saveError: Error | null): Error | null {
  return dataError ?? saveError;
}

// -- Queue initialization and package updates --
function applyFetchedReviewDeck({
  loading,
  fetchedResult,
  processedDeckDataRef,
  queueDataRef,
  reviewQueueRef,
  activeDirectionRef,
  completedOffsetRef,
  reviewKind,
  setCompletedCount,
  setTotalCount,
  setFinishedReview,
  setRetryAction,
  resetQuestionState,
  setQueueVersion,
}: ApplyFetchedReviewDeckOptions): void {
  if (!shouldProcessFetchedDeck(loading, fetchedResult, processedDeckDataRef.current)) return;

  // Keep an active session's queue stable; new package data is used by later sessions.
  if (queueDataRef.current !== null) {
    processedDeckDataRef.current = fetchedResult;
    return;
  }

  const queue = createReviewQueue(getReviewQueueEntries(fetchedResult), reviewKind);
  activeDirectionRef.current = fetchedResult.reviewDirection;
  processedDeckDataRef.current = fetchedResult;
  queueDataRef.current = fetchedResult;
  reviewQueueRef.current = queue;
  setCompletedCount(completedOffsetRef.current + queue.completedCount);
  setTotalCount(getAvailableReviewCount(fetchedResult, queue));
  setFinishedReview(getCurrentReviewEntry(queue) === null);
  setRetryAction(null);
  resetQuestionState();
  setQueueVersion((version) => version + 1);
}

function completeFinishedReview(
  finishedReview: boolean,
  queue: ReviewQueue | null,
  completePractice: () => Promise<void>,
): void {
  if (finishedReview && queue) void completePractice();
}

// -- Answer persistence and retry flow --
async function persistAndAdvanceReviewItem({
  updatedItem,
  userId,
  reviewKind,
  reviewDirection,
  saveReviewItem,
  pendingAnswerRef,
  setSaveError,
  setRetryAction,
  reviewQueueRef,
  activeDirectionRef,
  queueDataRef,
  completedOffsetRef,
  setCompletedCount,
  setTotalCount,
  setQueueVersion,
  setFinishedReview,
  resetQuestionState,
  completePractice,
}: PersistAndAdvanceReviewItemOptions): Promise<void> {
  const queue = reviewQueueRef.current;
  if (!queue) return;

  const didSave = await saveReviewItem(updatedItem);
  if (!didSave) {
    pendingAnswerRef.current = updatedItem;
    setRetryAction('save');
    return;
  }

  const currentPackage = userId
    ? await ensureDataPackage(userId, { kind: 'review-practice', reviewKind })
    : null;
  if (!currentPackage) {
    setSaveError(new Error('Cannot refresh review data without an active user.'));
    pendingAnswerRef.current = updatedItem;
    setRetryAction('save');
    return;
  }
  const answerResult = answerCurrentReviewItem(queue, updatedItem);
  if (!answerResult) return;

  const availableDueCount = getAvailableDueCount(currentPackage.availability, reviewKind, reviewDirection);
  pendingAnswerRef.current = null;
  setRetryAction(null);
  await continueAnsweredQueue({
    answerResult,
    queue,
    activeDirectionRef,
    reviewQueueRef,
    queueDataRef,
    completedOffsetRef,
    setCompletedCount,
    setTotalCount,
    availableDueCount,
    reviewPackage: currentPackage,
    reviewDirection,
    setFinishedReview,
    setRetryAction,
    setQueueVersion,
    resetQuestionState,
    completePractice,
  });
}

async function answerNextReviewItem({
  outcome,
  currentItem,
  userId,
  reviewQueueRef,
  isTransitioningRef,
  persistAndAdvance,
}: AnswerNextReviewItemOptions): Promise<void> {
  if (isTransitioningRef.current) return;
  isTransitioningRef.current = true;
  try {
    if (!currentItem || !userId || !reviewQueueRef.current) return;
    const updatedItem = UserItem.applyPracticeProgress(
      currentItem,
      outcome,
      new Date(Date.now()).toISOString(),
      { direction: currentItem.review_direction },
    );
    await persistAndAdvance(updatedItem);
  } finally {
    isTransitioningRef.current = false;
  }
}

async function retryPendingReviewItem({
  retryAction,
  pendingAnswerRef,
  isTransitioningRef,
  persistAndAdvance,
}: RetryPendingReviewItemOptions): Promise<void> {
  const pendingItem = pendingAnswerRef.current;
  if (!retryAction || !pendingItem || isTransitioningRef.current) return;
  isTransitioningRef.current = true;
  try {
    await persistAndAdvance(pendingItem);
  } finally {
    isTransitioningRef.current = false;
  }
}

function getVisibleReviewEntry(
  finished: boolean,
  queue: ReviewQueue | null,
): Readonly<{ currentEntry: PracticeDeckEntry | null; currentItem: PracticeDeckEntry['item'] | null }> {
  const currentEntry = finished ? null : getCurrentReviewEntry(queue);
  return { currentEntry, currentItem: currentEntry?.item ?? null };
}

async function saveReviewItemForUser(
  userId: string | null,
  item: UserItemLocal,
  setSaveError: SaveErrorSetter,
): Promise<boolean> {
  if (!userId) return false;

  try {
    if (item.review_direction === 'en_to_cz') {
      await UserItem.savePracticeDeck([item], 'en_to_cz');
    } else {
      await UserItem.savePracticeDeck([item]);
    }
  } catch (caughtError: unknown) {
    const normalizedError = toError(caughtError);
    setSaveError(normalizedError);
    reportError('Failed to save review progress', normalizedError);
    return false;
  }

  setSaveError(null);
  return true;
}

async function completePracticeOnce(
  handledRef: MutableRef<boolean>,
  finishPractice: () => Promise<void>,
  onComplete: PracticeCompletionHandler | undefined,
): Promise<void> {
  if (handledRef.current) return;
  handledRef.current = true;
  await finishPractice();
  onComplete?.();
}

function getRetryHandler(
  retryAction: ReviewRetryAction | null,
  retryPractice: () => Promise<void>,
): (() => Promise<void>) | undefined {
  return retryAction ? retryPractice : undefined;
}

function getReviewProgressLabel(completedCount: number, totalCount: number | null): string {
  if (totalCount === null) return String(completedCount);
  return `${completedCount} / ${totalCount}`;
}

function getReviewPronunciation(
  currentItem: PracticeDeckEntry['item'] | null,
  revealed: boolean,
): string {
  if (!revealed) return NBSP;
  return currentItem?.pronunciation || NBSP;
}

function getAvailableDueCount(
  availability: ReviewAvailability | null,
  reviewKind: ReviewKind,
  reviewDirection: ReviewDirection | undefined,
): number | null {
  if (!availability) return null;
  if (reviewDirection) return availability.reviewDueCounts[reviewKind][reviewDirection];
  if (reviewKind === 'grammar') return availability.grammarReviewDueCount;
  return availability.vocabularyReviewDueCount;
}

// -- Queue transitions and direction changes --
async function continueAnsweredQueue({
  answerResult,
  queue,
  activeDirectionRef,
  reviewQueueRef,
  queueDataRef,
  completedOffsetRef,
  setCompletedCount,
  setTotalCount,
  availableDueCount,
  reviewPackage,
  reviewDirection,
  setFinishedReview,
  setRetryAction,
  setQueueVersion,
  resetQuestionState,
  completePractice,
}: ContinueAnsweredQueueOptions): Promise<void> {
  const completedCount = completedOffsetRef.current + queue.completedCount;
  setCompletedCount(completedCount);
  if (availableDueCount !== null) setTotalCount(completedCount + availableDueCount);

  if (answerResult.hasNextItem) {
    setQueueVersion((version) => version + 1);
    resetQuestionState();
    return;
  }

  if (reviewDirection === undefined) {
    const nextDeck = loadNextDirectionDeck(reviewPackage, activeDirectionRef.current);
    if (nextDeck) {
      completedOffsetRef.current += queue.completedCount;
      startDirectionDeck({
        deck: nextDeck,
        queueRef: reviewQueueRef,
        dataRef: queueDataRef,
        directionRef: activeDirectionRef,
        update: (nextQueue) => {
          setCompletedCount(completedOffsetRef.current + nextQueue.completedCount);
        },
        setFinishedReview,
        setRetryAction,
        setQueueVersion,
        resetQuestionState,
      });
      return;
    }
  }

  await completePractice();
}

function loadNextDirectionDeck(
  reviewPackage: ReviewPracticePackage,
  currentDirection: ReviewDirection,
): ReviewDeckData | null {
  if (currentDirection === 'cz_to_en') {
    const enToCzDeck = reviewPackage.decks.en_to_cz;
    return enToCzDeck.entries.length > 0 ? enToCzDeck : null;
  }

  const czToEnDeck = reviewPackage.decks.cz_to_en;
  if (czToEnDeck.entries.length > 0) return czToEnDeck;

  const enToCzDeck = reviewPackage.decks.en_to_cz;
  if (enToCzDeck.entries.length > 0) return enToCzDeck;
  return null;
}

function startDirectionDeck({
  deck,
  queueRef,
  dataRef,
  directionRef,
  update,
  setFinishedReview,
  setRetryAction,
  setQueueVersion,
  resetQuestionState,
}: StartDirectionDeckOptions): void {
  const nextQueue = createReviewQueue(getReviewQueueEntries(deck), deck.reviewKind);
  directionRef.current = deck.reviewDirection;
  dataRef.current = deck;
  queueRef.current = nextQueue;
  update(nextQueue);
  setFinishedReview(false);
  setRetryAction(null);
  setQueueVersion((version) => version + 1);
  resetQuestionState();
}

function getReviewQueueEntries(reviewDeck: ReviewDeckData): readonly PracticeDeckEntry[] {
  const entries = reviewDeck.prefetchedEntries ?? reviewDeck.entries;
  return entries.filter((entry) => entry.item.review_direction === reviewDeck.reviewDirection);
}

function shouldProcessFetchedDeck(
  loading: boolean,
  fetchedResult: ReviewDeckData | null,
  processedDeck: ReviewDeckData | null,
): fetchedResult is ReviewDeckData {
  return !loading && fetchedResult !== null && processedDeck !== fetchedResult;
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

function getAvailableReviewCount(
  deck: ReviewDeckData | undefined,
  queue: ReviewQueue | null,
): number | null {
  if (deck?.availableCount !== undefined) return deck.availableCount;
  return getInitialSessionTotalCount(queue);
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
