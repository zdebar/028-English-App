import { useEffect, useRef, useCallback, useState } from 'react';
import { alternateDirection } from '@/features/practice/practice.utils';
import type { ReviewPracticeMode, UserItemPractice } from '@/types/user-item.types';
import { useFetch } from '@/hooks/use-fetch';
import UserItem from '@/database/models/user-items';
import UserScore from '@/database/models/user-scores';
import { reportError, reportInfo } from '@/features/logging/monitoring-handler';
import { NBSP } from './use-hint';
import { usePracticeCardState } from './use-practice-card-state';
import { triggerLevelsUpdatedEvent } from '@/utils/dashboard.utils';
import config from '@/config/config';
import UserBlock from '@/database/models/user-blocks';

/**
 * usePracticeDeck hook manages the practice deck and user progress for a given user.
 *
 * @param userId The unique identifier of the user.
 */
export function usePracticeDeck(userId: string | null, mode: ReviewPracticeMode = 'vocabulary') {
  // Array fetching logic
  const [array, setArray] = useState<UserItemPractice[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const fetchPracticeDeck = useCallback(async () => {
    if (!userId) return [];
    const data = await UserItem.getPracticeDeck(userId, config.lesson.deckSize, mode);
    return data.filter((item) => item != null);
  }, [mode, userId]);

  const {
    data: fetchedArray,
    loading,
    error,
    reload,
  } = useFetch<UserItemPractice[]>(fetchPracticeDeck);

  const activeArray = array.length > 0 ? array : (fetchedArray ?? []);
  const currentItem = activeArray[index] ?? null;

  const isCzToEn = currentItem ? alternateDirection(currentItem?.progress) : true; // true = CZ -> EN, false = EN -> CZ
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
  const userProgressRef = useRef<UserItemPractice[]>([]);

  const persistProgressToLocalStorage = useCallback(
    (userProgress: UserItemPractice[]) => {
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
    async (userProgress: UserItemPractice[], source: string, shouldReload: boolean = false) => {
      if (userProgress.length === 0 || !userId) {
        return;
      }

      try {
        await UserItem.savePracticeDeck(userProgress);
        if (mode === 'vocabulary') {
          await UserBlock.unlockNextGrammarBlock(userId);
        }
        reportInfo(`Saved practice deck ${source} with ${userProgress.length} items.`);
        userProgressRef.current = [];
        if (shouldReload) {
          reload();
        }
      } catch (error) {
        reportError(`Failed to save practice deck ${source}`, error);
        persistProgressToLocalStorage(userProgress);
      }
    },
    [mode, persistProgressToLocalStorage, reload, userId],
  );

  // Save progress on unmount
  useEffect(() => {
    return () => {
      (async () => {
        if (userId) {
          await saveBufferedProgress([...userProgressRef.current], 'on unmount');
          triggerLevelsUpdatedEvent(userId);
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

  // Advance to next item and record progress change
  const nextItem = useCallback(
    async (progressChange: number = 0) => {
      if (!currentItem) {
        return;
      }

      const updatedItem = {
        ...currentItem,
        progress: Math.max(currentItem.progress + progressChange, 0),
        progress_history: [
          ...currentItem.progress_history,
          {
            progress: Math.max(currentItem.progress + progressChange, 0),
            created_at: new Date().toISOString(),
          },
        ],
      };

      userProgressRef.current.push(updatedItem);

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

  return {
    // Core state
    index,
    currentItem,
    noteId: currentItem?.note_id ?? null,
    grammarId: currentItem?.grammar_id ?? null,
    progress: currentItem?.progress ?? 0,
    isCzToEn,
    revealed,
    setRevealed,
    showNewGrammarIndicator: currentItem?.show_new_grammar_indicator ?? false,

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
