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
import PracticeSession from '@/database/models/practice-sessions';
import { reportError } from '@/features/logging/monitoring-handler';
import { NBSP } from './use-hint';
import { usePracticeCardState } from './use-practice-card-state';
import { invalidateRouteData, routeDataKey } from '@/routing/route-data-handoff';
import {
  loadReviewSessionDeck,
  type ReviewSessionDeck,
} from '@/database/utils/practice-content.utils';
import config from '@/config/config';
import { getStarTierForCount, type StarTier } from '@/utils/star-progress.utils';
import { useStarCelebration } from './use-star-celebration';

/** Manages a persisted, configured-length review session. */
export function usePracticeDeck(userId: string | null, initialDeck?: PracticeDeckEntry[]) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const { celebratingStar, waitForAcknowledgement, acknowledgeCelebration, finishCelebration } =
    useStarCelebration();
  const [celebrationStarTier, setCelebrationStarTier] = useState<StarTier>('bronze');
  const [saveError, setSaveError] = useState<Error | null>(null);
  const [finishedReview, setFinishedReview] = useState(false);
  const [sessionProgress, setSessionProgress] = useState<{
    completedCount: number;
    targetCount: number;
  } | null>(null);
  const [sessionLoading, setSessionLoading] = useState(Boolean(userId));
  const completionPending = useRef(false);

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
  const cardState = usePracticeCardState({ currentItem, isCzToEn, revealed, setRevealed });
  const resetHint = cardState.resetHint;
  const resetQuestionState = cardState.resetQuestionState;

  useLayoutEffect(() => {
    resetReviewCard(setIndex, setRevealed, resetHint);
  }, [fetchedResult, resetHint]);

  const finalizeCompletedSession = useCallback(async () => {
    await finalizeReviewSession({
      userId,
      completionPending,
      waitForAcknowledgement,
      finishCelebration,
      reload,
      resetHint,
      setIndex,
      setRevealed,
      setSessionProgress,
      setFinishedReview,
      setSaveError,
    });
  }, [finishCelebration, reload, resetHint, userId, waitForAcknowledgement]);

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
      finalizeCompletedSession,
    });
  }, [fetchedResult, finalizeCompletedSession, loading, reload, userId]);

  const nextItem = useCallback(
    async (outcome: PracticeOutcome) => {
      await saveReviewAnswer(
        {
          currentItem,
          userId,
          celebratingStar,
          index,
          entriesLength: activeArray.length,
          resetQuestionState,
          finalizeCompletedSession,
          setSessionProgress,
          setCelebrationStarTier,
          setIndex,
          setRevealed,
          resetHint,
          reload,
          setSaveError,
        },
        outcome,
      );
    },
    [
      activeArray.length,
      celebratingStar,
      currentItem,
      finalizeCompletedSession,
      index,
      reload,
      resetHint,
      resetQuestionState,
      userId,
    ],
  );

  return {
    index,
    currentItem,
    note: currentEntry?.note ?? null,
    grammar: currentEntry?.grammar ?? null,
    progressLabel: getReviewProgressLabel(sessionProgress),
    sessionLoading,
    celebratingStar,
    celebrationStarTier,
    acknowledgeCelebration,
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
    error: getReviewError(error, saveError),
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
  const activeArray: PracticeDeckEntry[] = fetchedResult?.entries ?? [];
  const currentEntry: PracticeDeckEntry | null = activeArray[index] ?? null;
  const currentItem: PracticeDeckEntry['item'] | null = currentEntry?.item ?? null;
  const isCzToEn = currentItem?.practice_direction !== 'enToCz';
  return { activeArray, currentEntry, currentItem, isCzToEn };
}

function getReviewError(error: Error | null, saveError: Error | null): Error | null {
  return error ?? saveError;
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

type FinalizeReviewSessionOptions = Readonly<{
  userId: string | null;
  completionPending: { current: boolean };
  waitForAcknowledgement: () => Promise<void>;
  finishCelebration: () => void;
  reload: () => Promise<unknown>;
  resetHint: () => void;
  setIndex: Dispatch<SetStateAction<number>>;
  setRevealed: Dispatch<SetStateAction<boolean>>;
  setSessionProgress: Dispatch<
    SetStateAction<{ completedCount: number; targetCount: number } | null>
  >;
  setFinishedReview: Dispatch<SetStateAction<boolean>>;
  setSaveError: Dispatch<SetStateAction<Error | null>>;
}>;

async function finalizeReviewSession(options: FinalizeReviewSessionOptions): Promise<void> {
  const {
    userId,
    completionPending,
    waitForAcknowledgement,
    finishCelebration,
    reload,
    resetHint,
    setIndex,
    setRevealed,
    setSessionProgress,
    setFinishedReview,
    setSaveError,
  } = options;
  if (!userId || completionPending.current) return;
  completionPending.current = true;
  await waitForAcknowledgement();

  try {
    const availability = await UserItem.getReadyReviewState(userId);
    const reviewReady =
      availability.reviewReadyAt !== null && Date.parse(availability.reviewReadyAt) <= Date.now();
    if (reviewReady) {
      await PracticeSession.continueReview(userId);
      invalidateRouteData(routeDataKey('practice', userId));
      await reload();
      setSessionProgress((currentProgress) => {
        if (!currentProgress) {
          return { completedCount: 0, targetCount: config.practice.reviewStarSize };
        }
        return { ...currentProgress, completedCount: 0 };
      });
      resetReviewCard(setIndex, setRevealed, resetHint);
      finishCelebration();
      completionPending.current = false;
      return;
    }

    await PracticeSession.deleteByUserId(userId);
    setFinishedReview(true);
  } catch (caughtError) {
    const normalizedError = toError(caughtError);
    setSaveError(normalizedError);
    reportError('Failed to finish review star celebration', normalizedError);
    finishCelebration();
    completionPending.current = false;
  }
}

function reloadReviewSession(
  reload: () => Promise<unknown>,
  setSaveError: Dispatch<SetStateAction<Error | null>>,
  setSessionLoading: Dispatch<SetStateAction<boolean>>,
): void {
  void reload().catch((caughtError) => {
    setSaveError(toError(caughtError));
    setSessionLoading(false);
  });
}

type SyncReviewSessionOptions = Readonly<{
  userId: string | null;
  fetchedResult: ReviewSessionDeck | null | undefined;
  loading: boolean;
  reload: () => Promise<unknown>;
  setSessionProgress: Dispatch<
    SetStateAction<{ completedCount: number; targetCount: number } | null>
  >;
  setSessionLoading: Dispatch<SetStateAction<boolean>>;
  setFinishedReview: Dispatch<SetStateAction<boolean>>;
  setSaveError: Dispatch<SetStateAction<Error | null>>;
  finalizeCompletedSession: () => Promise<void>;
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
    finalizeCompletedSession,
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
    reloadReviewSession(reload, setSaveError, setSessionLoading);
    return;
  }

  const { completed_count: completedCount, target_count: targetCount } = fetchedResult.session;
  setSessionProgress({ completedCount, targetCount });
  setSessionLoading(false);
  if (completedCount >= targetCount) void finalizeCompletedSession();
}

type SaveReviewAnswerOptions = Readonly<{
  currentItem: PracticeDeckEntry['item'] | null;
  userId: string | null;
  celebratingStar: boolean;
  index: number;
  entriesLength: number;
  resetQuestionState: () => void;
  finalizeCompletedSession: () => Promise<void>;
  setSessionProgress: Dispatch<
    SetStateAction<{ completedCount: number; targetCount: number } | null>
  >;
  setCelebrationStarTier: Dispatch<SetStateAction<StarTier>>;
  setIndex: Dispatch<SetStateAction<number>>;
  setRevealed: Dispatch<SetStateAction<boolean>>;
  resetHint: () => void;
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
    celebratingStar,
    index,
    entriesLength,
    resetQuestionState,
    finalizeCompletedSession,
    setSessionProgress,
    setCelebrationStarTier,
    setIndex,
    setRevealed,
    resetHint,
    reload,
    setSaveError,
  } = options;
  if (!currentItem || !userId || celebratingStar) return;
  const dateTime = new Date(Date.now()).toISOString();
  const updatedItem = UserItem.applyPracticeProgress(
    currentItem,
    currentItem.practice_direction,
    outcome,
    dateTime,
  );

  try {
    const result = await PracticeSession.recordReviewAnswer(
      updatedItem,
      currentItem.practice_direction,
      dateTime,
    );
    setSessionProgress((currentProgress) => ({
      completedCount: result.completedCount,
      targetCount: currentProgress?.targetCount ?? config.practice.reviewStarSize,
    }));
    if (result.earnedStar) {
      setCelebrationStarTier(
        getStarTierForCount(result.starCount ?? 1, config.practice.starsPerRow),
      );
      resetQuestionState();
      await finalizeCompletedSession();
      return;
    }

    const nextIndex = index + 1;
    if (nextIndex < entriesLength) {
      setIndex(nextIndex);
      setRevealed(false);
      resetHint();
      return;
    }

    if (userId) invalidateRouteData(routeDataKey('practice', userId));
    await reload();
  } catch (caughtError) {
    const normalizedError = toError(caughtError);
    setSaveError(normalizedError);
    reportError('Failed to save review answer', normalizedError);
  }
}

function getReviewProgressLabel(
  progress: { completedCount: number; targetCount: number } | null,
): string {
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
