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
  getCachedReviewDeck,
  invalidateReviewDeck,
  loadCachedReviewDeck,
} from '../review-deck-cache';
import {
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

/** Loads complete review batches and saves each batch once at its boundary. */
export function usePracticeDeck(userId: string | null, initialData?: ReviewDeckData) {
  const { trackPracticeWrite, finishPractice } = usePracticeAvailabilityBoundary(userId);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [saveError, setSaveError] = useState<Error | null>(null);
  const [finishedReview, setFinishedReview] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const isTransitioningRef = useRef(false);
  const pendingProgressRef = useRef(new Map<number, UserItemLocal>());
  const countedDeckRef = useRef<ReviewDeckData | null>(null);
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

  const initialReviewDeck = initialData ?? (userId ? getCachedReviewDeck(userId) : undefined);
  const fetchPracticeDeck = useCallback(
    () => (userId ? loadCachedReviewDeck(userId) : Promise.resolve(createEmptyReviewDeck())),
    [userId],
  );
  const {
    data: fetchedResult,
    loading,
    error,
    reload,
  } = useFetch<ReviewDeckData>(fetchPracticeDeck, { initialData: initialReviewDeck });
  const reloadPracticeDeck = useCallback(async () => {
    if (userId) invalidateReviewDeck(userId);
    await reload();
  }, [reload, userId]);
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

  useEffect(() => {
    countedDeckRef.current = null;
    pendingProgressRef.current.clear();
    setCompletedCount(0);
    setTotalCount(null);

    if (!userId) return undefined;

    return () => {
      countedDeckRef.current = null;
    };
  }, [userId]);

  useLayoutEffect(() => {
    resetReviewCard(setIndex, setRevealed, resetHint);
  }, [fetchedResult, resetHint]);

  useEffect(() => {
    if (loading || !fetchedResult || countedDeckRef.current === fetchedResult) return;

    countedDeckRef.current = fetchedResult;
    setFinishedReview(fetchedResult.abandoned);
    setTotalCount((count) => (count ?? 0) + fetchedResult.entries.length);
  }, [fetchedResult, loading]);

  useEffect(() => {
    if (!finishedReview || !fetchedResult?.abandoned) return;
    void finishPractice();
  }, [fetchedResult?.abandoned, finishPractice, finishedReview]);

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
        await trackPracticeWrite(
          answerReviewCard({
            currentItem,
            currentIndex: index,
            batchSize: fetchedResult?.entries.length ?? 0,
            userId,
            pendingProgress: pendingProgressRef,
            resetQuestionState,
            reload: reloadPracticeDeck,
            setSaveError,
            setCompletedCount,
            setIndex,
            setFinishedReview,
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
      reloadPracticeDeck,
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

function createEmptyReviewDeck(): ReviewDeckData {
  return {
    entries: [],
    availabilityCheckedAt: new Date().toISOString(),
    abandoned: true,
  };
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
  setIndex: Dispatch<SetStateAction<number>>;
  setFinishedReview: Dispatch<SetStateAction<boolean>>;
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

  options.setFinishedReview(true);
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
    await refreshAfterReviewSave(options.reload, options.resetQuestionState, options.setSaveError);
  } catch (caughtError) {
    const normalizedError = toError(caughtError);
    options.setSaveError(normalizedError);
    reportError('Failed to save review batch', normalizedError);
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
