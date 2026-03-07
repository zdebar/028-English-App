import { useEffect, useRef, useCallback, useState } from 'react';
import { alternateDirection } from '@/features/practice/practice.utils';
import type { UserItemPractice } from '@/types/local.types';
import { useFetch } from '@/hooks/use-fetch';
import UserItem from '@/database/models/user-items';
import { errorHandler } from '@/features/logging/error-handler';
import { infoHandler } from '@/features/logging/info-handler';
import { useHint } from './use-hint';
import { useAudioManager } from './use-audio-manager';
import {
  triggerDailyCountUpdatedEvent,
  triggerLevelsUpdatedEvent,
} from '@/features/user-stats/dashboard.utils';
import { assertNonEmptyString } from '@/utils/assertions.utils';

const NBSP = '\u00A0';

/**
 * usePracticeDeck hook manages the practice deck and user progress for a given user.
 *
 * @param userId The unique identifier of the user.
 */
export function usePracticeDeck(userId: string) {
  assertNonEmptyString(userId, 'userId');

  // Array fetching logic
  const [array, setArray] = useState<UserItemPractice[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const currentItem = array[index] ?? null;

  const fetchPracticeDeck = useCallback(async () => {
    const data = await UserItem.getPracticeDeck(userId);
    return data.filter((item) => item != null);
  }, [userId]);

  const { data: fetchedArray, error, reload } = useFetch<UserItemPractice[]>(fetchPracticeDeck);

  const { czechHinted, englishHinted, resetHint, plusHint } = useHint(
    currentItem?.czech,
    currentItem?.english,
  );

  useEffect(() => {
    setArray(fetchedArray ?? []);
    setIndex(0);
    setRevealed(false);
    resetHint();
  }, [fetchedArray]);

  const {
    playAudio,
    setVolume,
    audioError,
    loading: audioLoading,
    isPlaying,
  } = useAudioManager(currentItem?.audio);

  // Derived states
  const isCzToEn = currentItem ? alternateDirection(currentItem?.progress) : true; // true = CZ -> EN, false = EN -> CZ
  const audioDisabled = (isCzToEn && !revealed) || !currentItem?.audio || audioError;
  const czech = isCzToEn || revealed ? currentItem?.czech : czechHinted;
  const english = revealed || (audioDisabled && !isCzToEn) ? currentItem?.english : englishHinted;

  const [wasCzToEn, setWasCzToEn] = useState<boolean | null>(null);
  const showDirectionChange = wasCzToEn !== isCzToEn;

  // Ref to track user progress changes before saving
  const userProgressRef = useRef<UserItemPractice[]>([]);

  const persistProgressToLocalStorage = useCallback(
    (userProgress: UserItemPractice[]) => {
      if (userProgress.length === 0 || !userId) {
        return;
      }

      localStorage.setItem(`practiceDeckProgress_${userId}`, JSON.stringify(userProgress));
    },
    [userId],
  );

  const saveBufferedProgress = useCallback(
    async (userProgress: UserItemPractice[], source: string, shouldReload: boolean = false) => {
      if (userProgress.length === 0 || !userId) {
        return;
      }

      try {
        await UserItem.savePracticeDeck(userId, userProgress);
        infoHandler(`Saved practice deck ${source} with ${userProgress.length} items.`);
        userProgressRef.current = [];
        if (shouldReload) {
          reload();
        }
      } catch (error) {
        errorHandler(`Failed to save practice deck ${source}`, error);
        persistProgressToLocalStorage(userProgress);
      }
    },
    [persistProgressToLocalStorage, reload, userId],
  );

  // Save progress on unmount
  useEffect(() => {
    return () => {
      (async () => {
        await saveBufferedProgress([...userProgressRef.current], 'on unmount');
        triggerLevelsUpdatedEvent(userId);
        triggerDailyCountUpdatedEvent(userId);
      })();
    };
  }, [saveBufferedProgress]);

  // Save progress to localStorage on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      const userProgress = [...userProgressRef.current];
      persistProgressToLocalStorage(userProgress);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
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
      };

      userProgressRef.current.push(updatedItem);

      const userProgress = [...userProgressRef.current];
      if (userProgress.length >= array.length) {
        await saveBufferedProgress(userProgress, 'during practice', true);
      } else {
        setIndex((prev) => (array.length ? (prev + 1) % array.length : 0));
        setRevealed(false);
        resetHint();
      }
    },
    [array.length, currentItem, resetHint, saveBufferedProgress],
  );

  return {
    // Core state
    index,
    currentItem,
    grammar_id: currentItem?.grammar_id ?? null,
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
    hideDirectionChange: () => setWasCzToEn(isCzToEn),

    // Hinting
    plusHint,

    // Navigation & loading
    nextItem,
    error,

    // Audio management
    audioError,
    setVolume,
    playAudio,
    audioLoading,
    isPlaying,
  };
}
