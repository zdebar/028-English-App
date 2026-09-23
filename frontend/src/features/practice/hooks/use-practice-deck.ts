import { usePracticeAvailabilityBoundary } from './use-practice-availability-boundary';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import type { PracticeDeckEntry, PracticeOutcome, UserItemLocal } from '@/types/user-item.types';
import { useFetch } from '@/hooks/use-fetch';
import UserItem from '@/database/models/user-items';
import { reportError } from '@/features/logging/monitoring-handler';
import { NBSP } from './use-hint';
import { usePracticeCardState } from './use-practice-card-state';
import {
  loadReviewEntryDetails,
  loadReviewCount,
  loadReviewDeckData,
  type ReviewDeckData,
} from '@/database/utils/practice-content.utils';

/** Loads complete review batches and saves each batch once at its boundary. */
export function usePracticeDeck(userId: string | null) {
  const trackPracticeWrite = usePracticeAvailabilityBoundary(userId);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [saveError, setSaveError] = useState<Error | null>(null);
  const [finishedReview, setFinishedReview] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const isTransitioningRef = useRef(false);
  const pendingProgressRef = useRef(new Map<number, UserItemLocal>());
  const availabilityCheckpointRef = useRef<string | null>(null);
  const counterRefreshStartedRef = useRef(false);
  const counterResolvedRef = useRef(false);
  const counterRequestIdRef = useRef(0);
  const [secondaryContent, setSecondaryContent] = useState<SecondaryContent | null>(null);
  const secondaryContentRequestIdRef = useRef(0);

  const fetchPracticeDeck = useCallback(async () => {
    const result = await fetchReviewDeck(userId);
    availabilityCheckpointRef.current ??= result.availabilityCheckedAt;
    return result;
  }, [userId]);
  const {
    data: fetchedResult,
    loading,
    error,
    reload,
  } = useFetch<ReviewDeckData>(fetchPracticeDeck);
  const { currentEntry, currentItem } = useMemo(
    () => getReviewDeckView(fetchedResult, index),
    [fetchedResult, index],
  );
  const cardState = usePracticeCardState({
    currentItem,
    revealed,
    isCompletion: finishedReview,
    setRevealed,
  });
  const resetHint = cardState.resetHint;
  const resetQuestionState = cardState.resetQuestionState;

  useLayoutEffect(() => {
    resetReviewCard(setIndex, setRevealed, resetHint);
  }, [fetchedResult, resetHint]);

  useEffect(() => {
    if (loading || !fetchedResult) return;
    setFinishedReview(fetchedResult.abandoned);
  }, [fetchedResult, loading]);

  useEffect(() => {
    counterRequestIdRef.current += 1;
    counterRefreshStartedRef.current = false;
    counterResolvedRef.current = false;
    availabilityCheckpointRef.current = null;
    pendingProgressRef.current.clear();
    setCompletedCount(0);
    setTotalCount(null);

    if (!userId) return undefined;

    return () => {
      counterRequestIdRef.current += 1;
      counterRefreshStartedRef.current = false;
      counterResolvedRef.current = false;
    };
  }, [userId]);

  useEffect(() => {
    if (loading || !userId || !fetchedResult || counterRefreshStartedRef.current) return undefined;

    counterRefreshStartedRef.current = true;
    const requestId = ++counterRequestIdRef.current;
    let isActive = true;

    void loadReviewCount(userId)
      .then(({ count, countedThrough }) => {
        if (!isActive || requestId !== counterRequestIdRef.current) return;
        setTotalCount(count);
        advanceAvailabilityCheckpoint(availabilityCheckpointRef, countedThrough);
        counterResolvedRef.current = true;
      })
      .catch((caughtError: unknown) => {
        if (!isActive || requestId !== counterRequestIdRef.current) return;
        counterRefreshStartedRef.current = false;
        reportError('Failed to refresh review counter', toError(caughtError));
      });

    return undefined;
  }, [fetchedResult, loading, userId]);

  useEffect(() => {
    if (!userId || !currentItem) {
      setSecondaryContent(null);
      return undefined;
    }

    const requestId = ++secondaryContentRequestIdRef.current;
    let isActive = true;
    const itemKey = getReviewItemKey(currentItem);

    void loadReviewEntryDetails(userId, currentItem)
      .then((details) => {
        if (!isActive || requestId !== secondaryContentRequestIdRef.current) return;
        setSecondaryContent({ itemKey, ...details });
      })
      .catch((caughtError: unknown) => {
        if (!isActive || requestId !== secondaryContentRequestIdRef.current) return;
        reportError('Failed to load practice card details', toError(caughtError));
      });

    return () => {
      isActive = false;
      if (requestId === secondaryContentRequestIdRef.current) {
        secondaryContentRequestIdRef.current += 1;
      }
    };
  }, [currentItem, userId]);

  const nextItem = useCallback(
    async (outcome: PracticeOutcome) => {
      if (isTransitioningRef.current) return;
      isTransitioningRef.current = true;

      try {
        await trackPracticeWrite(
          answerReviewCard({
            currentItem,
            currentIndex: index,
            batchSize: fetchedResult?.entries.length ?? 0,
            userId,
            pendingProgress: pendingProgressRef,
            resetQuestionState,
            reload,
            setSaveError,
            setCompletedCount,
            setTotalCount,
            availabilityCheckpointRef,
            counterResolvedRef,
            setIndex,
          }, outcome),
        );
      } finally {
        isTransitioningRef.current = false;
      }
    },
    [
      currentItem,
      fetchedResult?.entries.length,
      index,
      reload,
      resetQuestionState,
      trackPracticeWrite,
      userId,
    ],
  );

  return {
    index,
    currentItem,
    note: getSecondaryNote(currentEntry, secondaryContent),
    grammar: getSecondaryGrammar(currentEntry, secondaryContent),
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
    loading,
    error: error ?? saveError,
    audioError: cardState.audioError,
    playAudio: cardState.playAudio,
    audioLoading: cardState.audioLoading,
    isPlaying: cardState.isPlaying,
  };
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

function fetchReviewDeck(userId: string | null): Promise<ReviewDeckData> {
  if (!userId) {
    return Promise.resolve({
      entries: [],
      availabilityCheckedAt: new Date().toISOString(),
      abandoned: true,
    });
  }
  return loadReviewDeckData(userId);
}

function getReviewProgressLabel(completedCount: number, totalCount: number | null): string {
  if (totalCount === null) return String(completedCount);
  return `${completedCount} / ${totalCount}`;
}

function getReviewDeckView(
  fetchedResult: ReviewDeckData | null | undefined,
  index: number,
): Readonly<{
  currentEntry: PracticeDeckEntry | null;
  currentItem: PracticeDeckEntry['item'] | null;
}> {
  const activeArray = fetchedResult?.entries ?? [];
  const currentEntry = activeArray[index] ?? null;
  return { currentEntry, currentItem: currentEntry?.item ?? null };
}

function resetReviewCard(
  setIndex: Dispatch<SetStateAction<number>>,
  setRevealed: Dispatch<SetStateAction<boolean>>,
  resetHint: () => void,
): void {
  setIndex(0);
  setRevealed(false);
  resetHint();
}

type AnswerReviewCardOptions = Readonly<{
  currentItem: PracticeDeckEntry['item'] | null;
  currentIndex: number;
  batchSize: number;
  userId: string | null;
  pendingProgress: { current: Map<number, UserItemLocal> };
  resetQuestionState: () => void;
  reload: () => Promise<unknown>;
  setSaveError: Dispatch<SetStateAction<Error | null>>;
  setCompletedCount: Dispatch<SetStateAction<number>>;
  setTotalCount: Dispatch<SetStateAction<number | null>>;
  availabilityCheckpointRef: { current: string | null };
  counterResolvedRef: { current: boolean };
  setIndex: Dispatch<SetStateAction<number>>;
}>;

async function answerReviewCard(
  options: AnswerReviewCardOptions,
  outcome: PracticeOutcome,
): Promise<void> {
  const { currentItem, userId, pendingProgress } = options;
  if (!currentItem || !userId) return;

  const updatedItem = UserItem.applyPracticeProgress(
    currentItem,
    outcome,
    new Date(Date.now()).toISOString(),
  );
  pendingProgress.current.set(updatedItem.item_id, updatedItem);
  options.setCompletedCount((count) => count + 1);

  const isBatchEnd = options.currentIndex + 1 >= options.batchSize;
  if (!isBatchEnd) {
    options.setIndex((currentIndex) => currentIndex + 1);
    options.resetQuestionState();
    return;
  }

  await saveReviewBatch(options);
}

async function saveReviewBatch(options: AnswerReviewCardOptions): Promise<void> {
  const pendingItems = [...options.pendingProgress.current.values()];
  const userId = options.userId;
  if (pendingItems.length === 0 || !userId) return;

  try {
    await UserItem.savePracticeDeck(pendingItems);
    options.pendingProgress.current.clear();
    options.setSaveError(null);
    await refreshReviewAvailabilityCount({
      userId,
      setSaveError: options.setSaveError,
      setTotalCount: options.setTotalCount,
      availabilityCheckpointRef: options.availabilityCheckpointRef,
      counterResolvedRef: options.counterResolvedRef,
    });
    await refreshAfterReviewSave(options.reload, options.resetQuestionState, options.setSaveError);
  } catch (caughtError) {
    const normalizedError = toError(caughtError);
    options.setSaveError(normalizedError);
    reportError('Failed to save review batch', normalizedError);
  }
}

type RefreshReviewAvailabilityCountOptions = Readonly<{
  userId: string;
  setSaveError: Dispatch<SetStateAction<Error | null>>;
  setTotalCount: Dispatch<SetStateAction<number | null>>;
  availabilityCheckpointRef: { current: string | null };
  counterResolvedRef: { current: boolean };
}>;

async function refreshReviewAvailabilityCount(
  options: RefreshReviewAvailabilityCountOptions,
): Promise<void> {
  const countedThrough = new Date(Date.now()).toISOString();
  if (!options.counterResolvedRef.current) return;

  const checkedAt = options.availabilityCheckpointRef.current ?? countedThrough;
  try {
    const newlyAvailableCount = await UserItem.getNewlyAvailableReviewItemCount(
      options.userId,
      checkedAt,
      countedThrough,
    );
    options.setTotalCount((count) => (count === null ? null : count + newlyAvailableCount));
    advanceAvailabilityCheckpoint(options.availabilityCheckpointRef, countedThrough);
  } catch (caughtError) {
    const normalizedError = toError(caughtError);
    options.setSaveError(normalizedError);
    reportError('Failed to refresh review availability count', normalizedError);
  }
}

function advanceAvailabilityCheckpoint(
  checkpointRef: { current: string | null },
  candidate: string,
): void {
  if (checkpointRef.current === null || candidate > checkpointRef.current) {
    checkpointRef.current = candidate;
  }
}

async function refreshAfterReviewSave(
  reload: () => Promise<unknown>,
  resetQuestionState: () => void,
  setSaveError: Dispatch<SetStateAction<Error | null>>,
): Promise<void> {
  try {
    await reload();
    resetQuestionState();
  } catch (caughtError) {
    const normalizedError = toError(caughtError);
    setSaveError(normalizedError);
    reportError('Failed to refresh review deck', normalizedError);
  }
}

type SecondaryContent = Readonly<{
  itemKey: string;
  note: PracticeDeckEntry['note'];
  grammar: PracticeDeckEntry['grammar'];
}>;

function getReviewItemKey(item: PracticeDeckEntry['item']): string {
  return String(item.item_id);
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

function getReviewPronunciation(
  currentItem: PracticeDeckEntry['item'] | null,
  revealed: boolean,
): string {
  if (!revealed) return NBSP;
  return currentItem?.pronunciation || NBSP;
}
