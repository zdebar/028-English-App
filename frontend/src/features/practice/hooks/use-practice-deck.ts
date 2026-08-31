import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import type { PracticeDeckEntry, PracticeOutcome } from '@/types/user-item.types';
import { useFetch } from '@/hooks/use-fetch';
import UserItem from '@/database/models/user-items';
import PracticeSession from '@/database/models/practice-sessions';
import { reportError } from '@/features/logging/monitoring-handler';
import { NBSP } from './use-hint';
import { usePracticeCardState } from './use-practice-card-state';
import { invalidateRouteData, routeDataKey } from '@/routing/route-data-handoff';
import {
  loadReviewSessionDeck,
  type ReviewSessionDeck,
} from '@/database/utils/practice-content.utils';

type SessionProgress = Readonly<{ completedCount: number; targetCount: number }>;

/** Manages a persisted, continuously replenished review session. */
export function usePracticeDeck(userId: string | null, initialDeck?: PracticeDeckEntry[]) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [saveError, setSaveError] = useState<Error | null>(null);
  const [finishedReview, setFinishedReview] = useState(false);
  const [sessionProgress, setSessionProgress] = useState<SessionProgress | null>(null);
  const [sessionLoading, setSessionLoading] = useState(Boolean(userId));

  const fetchPracticeDeck = useCallback(() => fetchReviewDeck(userId), [userId]);
  const initialResult = useMemo(() => createInitialReviewResult(initialDeck), [initialDeck]);
  const {
    data: fetchedResult,
    loading,
    error,
    reload,
  } = useFetch<ReviewSessionDeck>(fetchPracticeDeck, { initialData: initialResult });
  const { activeArray, currentEntry, currentItem, isCzToEn } = useMemo(
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
    syncReviewSession({
      userId,
      fetchedResult,
      loading,
      reload,
      setSessionProgress,
      setSessionLoading,
      setFinishedReview,
      setSaveError,
    });
  }, [fetchedResult, loading, reload, userId]);

  const nextItem = useCallback(
    async (outcome: PracticeOutcome) => {
      await saveReviewAnswer(
        {
          currentItem,
          userId,
          index,
          entriesLength: activeArray.length,
          resetQuestionState,
          setSessionProgress,
          setIndex,
          setSessionLoading,
          reload,
          setSaveError,
        },
        outcome,
      );
    },
    [activeArray.length, currentItem, index, reload, resetQuestionState, userId],
  );

  return {
    index,
    currentItem,
    note: currentEntry?.note ?? null,
    grammar: currentEntry?.grammar ?? null,
    progressLabel: getReviewProgressLabel(sessionProgress),
    sessionLoading,
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

function fetchReviewDeck(userId: string | null): Promise<ReviewSessionDeck> {
  if (!userId) return Promise.resolve({ entries: [], session: null, abandoned: false });
  return loadReviewSessionDeck(userId);
}

function createInitialReviewResult(initialDeck: PracticeDeckEntry[] | undefined) {
  if (!initialDeck) return undefined;
  return { entries: initialDeck, session: null, abandoned: false };
}

function getReviewDeckView(
  fetchedResult: ReviewSessionDeck | null | undefined,
  index: number,
): Readonly<{
  activeArray: PracticeDeckEntry[];
  currentEntry: PracticeDeckEntry | null;
  currentItem: PracticeDeckEntry['item'] | null;
  isCzToEn: boolean;
}> {
  const activeArray = fetchedResult?.entries ?? [];
  const currentEntry = activeArray[index] ?? null;
  const currentItem = currentEntry?.item ?? null;
  const isCzToEn = currentItem?.practice_direction !== 'enToCz';
  return { activeArray, currentEntry, currentItem, isCzToEn };
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

type SyncReviewSessionOptions = Readonly<{
  userId: string | null;
  fetchedResult: ReviewSessionDeck | null | undefined;
  loading: boolean;
  reload: () => Promise<unknown>;
  setSessionProgress: Dispatch<SetStateAction<SessionProgress | null>>;
  setSessionLoading: Dispatch<SetStateAction<boolean>>;
  setFinishedReview: Dispatch<SetStateAction<boolean>>;
  setSaveError: Dispatch<SetStateAction<Error | null>>;
}>;

function syncReviewSession(options: SyncReviewSessionOptions): void {
  const {
    userId,
    fetchedResult,
    loading,
    reload,
    setSessionProgress,
    setSessionLoading,
    setFinishedReview,
    setSaveError,
  } = options;
  if (!userId) {
    setSessionProgress(null);
    setSessionLoading(false);
    return;
  }
  if (!fetchedResult || loading) return;
  if (fetchedResult.abandoned) {
    setSessionProgress(null);
    setSessionLoading(false);
    setFinishedReview(true);
    return;
  }
  if (!fetchedResult.session) {
    setSessionLoading(true);
    void reload().catch((caughtError) => {
      setSaveError(toError(caughtError));
      setSessionLoading(false);
    });
    return;
  }

  const { completed_count: completedCount, target_count: targetCount } = fetchedResult.session;
  setSessionProgress({ completedCount, targetCount });
  setSessionLoading(false);
}

type SaveReviewAnswerOptions = Readonly<{
  currentItem: PracticeDeckEntry['item'] | null;
  userId: string | null;
  index: number;
  entriesLength: number;
  resetQuestionState: () => void;
  setSessionProgress: Dispatch<SetStateAction<SessionProgress | null>>;
  setIndex: Dispatch<SetStateAction<number>>;
  setSessionLoading: Dispatch<SetStateAction<boolean>>;
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
    index,
    entriesLength,
    resetQuestionState,
    setSessionProgress,
    setIndex,
    setSessionLoading,
    reload,
    setSaveError,
  } = options;
  if (!currentItem || !userId) return;

  const dateTime = new Date(Date.now()).toISOString();
  const direction = currentItem.practice_direction;
  const updatedItem = UserItem.applyPracticeProgress(currentItem, direction, outcome, dateTime);

  try {
    const result = await PracticeSession.recordReviewAnswer(
      currentItem,
      updatedItem,
      direction,
      dateTime,
    );
    setSessionProgress((currentProgress) => ({
      completedCount: result.completedCount,
      targetCount: currentProgress?.targetCount ?? entriesLength,
    }));

    resetQuestionState();
    if (index + 1 < entriesLength) {
      setIndex(index + 1);
      return;
    }

    setSessionLoading(true);
    invalidateRouteData(routeDataKey('practice', userId));
    await reload();
  } catch (caughtError) {
    const normalizedError = toError(caughtError);
    setSaveError(normalizedError);
    reportError('Failed to save review answer', normalizedError);
  }
}

function getReviewProgressLabel(progress: SessionProgress | null): string {
  if (!progress) return '';
  return `${progress.completedCount}/${progress.targetCount}`;
}

function getReviewPronunciation(
  currentItem: PracticeDeckEntry['item'] | null,
  revealed: boolean,
): string {
  if (!revealed) return NBSP;
  return currentItem?.pronunciation || NBSP;
}
