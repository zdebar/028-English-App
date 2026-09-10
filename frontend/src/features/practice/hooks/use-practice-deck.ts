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
import type { PracticeDeckEntry, PracticeOutcome } from '@/types/user-item.types';
import { useFetch } from '@/hooks/use-fetch';
import UserItem from '@/database/models/user-items';
import { reportError } from '@/features/logging/monitoring-handler';
import { NBSP } from './use-hint';
import { usePracticeCardState } from './use-practice-card-state';
import { invalidateRouteData, routeDataKey } from '@/routing/route-data-handoff';
import {
  loadReviewDeckData,
  type ReviewDeckData,
} from '@/database/utils/practice-content.utils';

/** Loads and saves one review card at a time without persisting a review session. */
export function usePracticeDeck(userId: string | null, initialDeck?: PracticeDeckEntry[]) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [saveError, setSaveError] = useState<Error | null>(null);
  const [finishedReview, setFinishedReview] = useState(false);
  const isTransitioningRef = useRef(false);

  const fetchPracticeDeck = useCallback(() => fetchReviewDeck(userId), [userId]);
  const initialResult = useMemo(() => createInitialReviewResult(initialDeck), [initialDeck]);
  const {
    data: fetchedResult,
    loading,
    error,
    reload,
  } = useFetch<ReviewDeckData>(fetchPracticeDeck, { initialData: initialResult });
  const { currentEntry, currentItem, isCzToEn } = useMemo(
    () => getReviewDeckView(fetchedResult, index),
    [fetchedResult, index],
  );
  const cardState = usePracticeCardState({
    currentItem,
    isCzToEn,
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

  const nextItem = useCallback(
    async (outcome: PracticeOutcome) => {
      if (isTransitioningRef.current) return;
      isTransitioningRef.current = true;

      try {
        await saveReviewAnswer(
          {
            currentItem,
            userId,
            resetQuestionState,
            reload,
            setSaveError,
          },
          outcome,
        );
      } finally {
        isTransitioningRef.current = false;
      }
    },
    [currentItem, reload, resetQuestionState, userId],
  );

  return {
    index,
    currentItem,
    note: currentEntry?.note ?? null,
    grammar: currentEntry?.grammar ?? null,
    progressLabel: '',
    finishedReview,
    isCzToEn,
    revealed,
    setRevealed,
    czech: cardState.czech,
    english: cardState.english,
    pronunciation: getReviewPronunciation(currentItem, revealed),
    audio: currentItem?.audio ?? null,
    audioDisabled: cardState.audioDisabled,
    showDirectionChange: cardState.showDirectionChange,
    hideDirectionChange: cardState.hideDirectionChange,
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
  if (!userId) return Promise.resolve({ entries: [], abandoned: true });
  return loadReviewDeckData(userId);
}

function createInitialReviewResult(initialDeck: PracticeDeckEntry[] | undefined) {
  if (!initialDeck) return undefined;
  return { entries: initialDeck.slice(0, 1), abandoned: false };
}

function getReviewDeckView(
  fetchedResult: ReviewDeckData | null | undefined,
  index: number,
): Readonly<{
  currentEntry: PracticeDeckEntry | null;
  currentItem: PracticeDeckEntry['item'] | null;
  isCzToEn: boolean;
}> {
  const activeArray = fetchedResult?.entries ?? [];
  const currentEntry = activeArray[index] ?? null;
  const currentItem = currentEntry?.item ?? null;
  const isCzToEn = currentItem?.practice_direction !== 'enToCz';
  return { currentEntry, currentItem, isCzToEn };
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

type SaveReviewAnswerOptions = Readonly<{
  currentItem: PracticeDeckEntry['item'] | null;
  userId: string | null;
  resetQuestionState: () => void;
  reload: () => Promise<unknown>;
  setSaveError: Dispatch<SetStateAction<Error | null>>;
}>;

async function saveReviewAnswer(
  options: SaveReviewAnswerOptions,
  outcome: PracticeOutcome,
): Promise<void> {
  const {
    currentItem,
    userId,
    resetQuestionState,
    reload,
    setSaveError,
  } = options;
  if (!currentItem || !userId) return;

  const dateTime = new Date(Date.now()).toISOString();
  const direction = currentItem.practice_direction;
  const updatedItem = UserItem.applyPracticeProgress(currentItem, direction, outcome, dateTime);

  try {
    await UserItem.savePracticeDeck([{ ...updatedItem, practice_direction: direction }]);
    invalidateRouteData(routeDataKey('practice', userId));
    await reload();
    resetQuestionState();
  } catch (caughtError) {
    const normalizedError = toError(caughtError);
    setSaveError(normalizedError);
    reportError('Failed to save review answer', normalizedError);
  }
}

function getReviewPronunciation(
  currentItem: PracticeDeckEntry['item'] | null,
  revealed: boolean,
): string {
  if (!revealed) return NBSP;
  return currentItem?.pronunciation || NBSP;
}
