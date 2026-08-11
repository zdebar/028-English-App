import { useEffect, useRef, useCallback, useState } from 'react';
import type {
  PracticeDeckEntry,
  PracticeDeckItem,
  PracticeOutcome,
} from '@/types/user-item.types';
import { useFetch } from '@/hooks/use-fetch';
import UserItem from '@/database/models/user-items';
import UserScore from '@/database/models/user-scores';
import { reportError, reportInfo } from '@/features/logging/monitoring-handler';
import { NBSP } from './use-hint';
import { usePracticeCardState } from './use-practice-card-state';
import { invalidateRouteData, routeDataKey } from '@/routing/route-data-cache';
import { loadPracticeDeck } from '@/database/utils/practice-content.utils';

/**
 * usePracticeDeck hook manages the practice deck and user progress for a given user.
 *
 * @param userId The unique identifier of the user.
 */
export function usePracticeDeck(userId: string | null, initialDeck?: PracticeDeckEntry[]) {
  // Array fetching logic
  const [array, setArray] = useState<PracticeDeckEntry[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const fetchPracticeDeck = useCallback(async () => {
    if (!userId) return [];
    return loadPracticeDeck(userId);
  }, [userId]);

  const {
    data: fetchedArray,
    loading,
    error,
    reload,
  } = useFetch<PracticeDeckEntry[]>(fetchPracticeDeck, { initialData: initialDeck });

  const activeArray = array.length > 0 ? array : (fetchedArray ?? []);
  const currentEntry = activeArray[index] ?? null;
  const currentItem = currentEntry?.item ?? null;

  const isCzToEn = currentItem?.practice_direction !== 'enToCz';
  const {
    audioDisabled,
    audioError,
    audioLoading,
    czech,
    english,
    handleReveal,
    hideDirectionChange,
    isPlaying,
    playAudio: playAudioInternal,
    plusHint,
    resetHint,
    showDirectionChange,
  } = usePracticeCardState({ currentItem, isCzToEn, revealed, setRevealed });

  useEffect(() => {
    setArray(fetchedArray ?? []);
    setIndex(0);
    setRevealed(false);
    resetHint();
  }, [fetchedArray]);

  // Ref to track user progress changes before saving
  const userProgressRef = useRef<PracticeDeckItem[]>([]);

  const persistProgressToLocalStorage = useCallback(
    (userProgress: PracticeDeckItem[]) => {
      if (userProgress.length === 0 || !userId) {
        return;
      }

      localStorage.setItem(
        `practiceDeckProgress_${userId}`,
        JSON.stringify({ dateTime: new Date(Date.now()).toISOString(), progress: userProgress }),
      );
    },
    [userId],
  );

  const saveBufferedProgress = useCallback(
    async (userProgress: PracticeDeckItem[], source: string, shouldReload: boolean = false) => {
      if (userProgress.length === 0 || !userId) {
        return;
      }

      try {
        await UserItem.savePracticeDeck(userProgress);
        reportInfo(`Saved practice deck ${source} with ${userProgress.length} items.`);
        userProgressRef.current = [];
        if (shouldReload) {
          invalidateRouteData(routeDataKey('practice', userId));
          reload();
        }
      } catch (error) {
        reportError(`Failed to save practice deck ${source}`, error);
        persistProgressToLocalStorage(userProgress);
      }
    },
    [persistProgressToLocalStorage, reload, userId],
  );

  // Save progress on unmount
  useEffect(() => {
    return () => {
      (async () => {
        if (userId) {
          await saveBufferedProgress([...userProgressRef.current], 'on unmount');
        }
      })();
    };
  }, [saveBufferedProgress]);

  // Save progress to localStorage on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      const userProgress = [...userProgressRef.current];
      persistProgressToLocalStorage(userProgress);
    };
    globalThis.addEventListener('beforeunload', handleBeforeUnload);
    return () => globalThis.removeEventListener('beforeunload', handleBeforeUnload);
  }, [persistProgressToLocalStorage]);

  // Advance to next item and record the explicit practice outcome.
  const nextItem = useCallback(
    async (outcome: PracticeOutcome) => {
      if (!currentItem) {
        return;
      }

      const updatedItem = UserItem.applyPracticeProgress(
        currentItem,
        currentItem.practice_direction,
        outcome,
        new Date().toISOString(),
      );

      userProgressRef.current.push({
        ...updatedItem,
        practice_direction: currentItem.practice_direction,
      });

      if (userId) {
        try {
          await UserScore.addItemCount(userId, 1);
        } catch (error) {
          reportError('Failed to update user score during practice', error);
        }
      }

      const userProgress = [...userProgressRef.current];
      if (userProgress.length >= activeArray.length) {
        await saveBufferedProgress(userProgress, 'during practice', true);
      } else {
        setIndex((prev) => (activeArray.length ? (prev + 1) % activeArray.length : 0));
        setRevealed(false);
        resetHint();
      }
    },
    [activeArray.length, currentItem, resetHint, saveBufferedProgress, userId],
  );

  const progress = getPracticeProgress(currentItem);

  return {
    // Core state
    index,
    currentItem,
    trainingBlockId: currentItem?.is_initial_training_trigger ? currentItem.block_id : null,
    note: currentEntry?.note ?? null,
    grammar: currentEntry?.grammar ?? null,
    progress,
    isCzToEn,
    revealed,
    setRevealed,
    // Display values
    czech,
    english,
    pronunciation: revealed ? currentItem?.pronunciation || NBSP : NBSP,
    audio: currentItem?.audio ?? null,
    audioDisabled,
    showDirectionChange,
    hideDirectionChange,
    handleReveal,

    // Hinting
    plusHint,

    // Navigation & loading
    nextItem,
    loading,
    error,

    // Audio management
    audioError,
    playAudio: playAudioInternal,
    audioLoading,
    isPlaying,
  };
}

function getPracticeProgress(item: PracticeDeckItem | null): number {
  if (!item) return 0;
  if (item.practice_direction === 'czToEn') return item.progress_cz_to_en;
  return item.progress_en_to_cz;
}
