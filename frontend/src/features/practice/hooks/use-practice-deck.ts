import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { PracticeDeckEntry, PracticeOutcome } from '@/types/user-item.types';
import { useFetch } from '@/hooks/use-fetch';
import UserItem from '@/database/models/user-items';
import PracticeSession from '@/database/models/practice-sessions';
import { reportError } from '@/features/logging/monitoring-handler';
import { NBSP } from './use-hint';
import { usePracticeCardState } from './use-practice-card-state';
import { invalidateRouteData, routeDataKey } from '@/routing/route-data-handoff';
import { loadReviewDeck } from '@/database/utils/practice-content.utils';
import config from '@/config/config';
import { getStarTierForCount, type StarTier } from '@/utils/star-progress.utils';
import { useStarCelebration } from './use-star-celebration';

/** Manages a persisted, configured-length review session. */
export function usePracticeDeck(userId: string | null, initialDeck?: PracticeDeckEntry[]) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const {
    celebratingStar,
    waitForAcknowledgement,
    acknowledgeCelebration,
    finishCelebration,
  } = useStarCelebration();
  const [celebrationStarTier, setCelebrationStarTier] = useState<StarTier>('bronze');
  const [saveError, setSaveError] = useState<Error | null>(null);
  const [finishedReview, setFinishedReview] = useState(false);
  const [sessionProgress, setSessionProgress] = useState<{
    completedCount: number;
    targetCount: number;
  } | null>(null);
  const [sessionLoading, setSessionLoading] = useState(userId != null);
  const completionPending = useRef(false);

  const fetchPracticeDeck = useCallback(async () => {
    if (!userId) return [];
    return loadReviewDeck(userId);
  }, [userId]);

  const { data: fetchedArray, loading, error, reload } = useFetch<PracticeDeckEntry[]>(
    fetchPracticeDeck,
    { initialData: initialDeck },
  );
  const activeArray = fetchedArray ?? [];
  const currentEntry = activeArray[index] ?? null;
  const currentItem = currentEntry?.item ?? null;
  const isCzToEn = currentItem?.practice_direction !== 'enToCz';
  const cardState = usePracticeCardState({ currentItem, isCzToEn, revealed, setRevealed });
  const resetHint = cardState.resetHint;
  const resetQuestionState = cardState.resetQuestionState;

  useLayoutEffect(() => {
    setIndex(0);
    setRevealed(false);
    resetHint();
  }, [fetchedArray, resetHint]);

  const finalizeCompletedSession = useCallback(async () => {
    if (!userId || completionPending.current) return;
    completionPending.current = true;
    await waitForAcknowledgement();

    try {
      const availability = await UserItem.getReadyReviewState(userId);
      const reviewReady =
        availability.reviewReadyAt !== null &&
        Date.parse(availability.reviewReadyAt) <= Date.now();
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
        setIndex(0);
        setRevealed(false);
        resetHint();
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
  }, [finishCelebration, reload, resetHint, userId, waitForAcknowledgement]);

  useEffect(() => {
    if (!userId) {
      setSessionProgress(null);
      setSessionLoading(false);
      return;
    }
    let active = true;
    setSessionLoading(true);
    void PracticeSession.startReview(userId)
      .then((session) => {
        if (!active) return;
        if (session.mode !== 'review') {
          throw new Error('Review practice requires an active review session.');
        }
        setSessionProgress({
          completedCount: session.completed_count,
          targetCount: session.target_count,
        });
        setSessionLoading(false);
        if (session.completed_count >= session.target_count) {
          void finalizeCompletedSession();
        }
      })
      .catch((caughtError) => {
        if (!active) return;
        setSaveError(toError(caughtError));
        setSessionLoading(false);
      });
    return () => {
      active = false;
    };
  }, [finalizeCompletedSession, userId]);

  const nextItem = useCallback(
    async (outcome: PracticeOutcome) => {
      if (!currentItem || !userId || celebratingStar) return;
      const dateTime = new Date(Date.now()).toISOString();
      const updatedItem = UserItem.applyPracticeProgress(
        currentItem,
        currentItem.practice_direction,
        outcome,
        dateTime,
      );

      try {
        const result = await PracticeSession.recordReviewAnswer(updatedItem, dateTime);
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
        if (nextIndex < activeArray.length) {
          setIndex(nextIndex);
          setRevealed(false);
          resetHint();
          return;
        }

        invalidateRouteData(routeDataKey('practice', userId));
        reload();
      } catch (caughtError) {
        const normalizedError = toError(caughtError);
        setSaveError(normalizedError);
        reportError('Failed to save review answer', normalizedError);
      }
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
    progressLabel: sessionProgress
      ? `${sessionProgress.completedCount}/${sessionProgress.targetCount}`
      : '',
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
    pronunciation: revealed ? currentItem?.pronunciation || NBSP : NBSP,
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
