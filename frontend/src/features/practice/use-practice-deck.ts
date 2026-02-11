import { useEffect, useRef, useCallback, useState } from 'react';
import { alternateDirection } from '@/features/practice/practice.utils';
import type { UserItemPractice } from '@/types/local.types';
import { usePracticeArray } from '@/features/practice/use-practice-array';
import UserItem from '@/database/models/user-items';
import { errorHandler } from '../logging/error-handler';
import { infoHandler } from '../logging/info-handler';
import { useHint } from './use-hint';
import { useAudioManager } from './use-audio-manager';

/**
 * usePracticeDeck hook manages the practice deck and user progress for a given user.
 *
 * @param userId The unique identifier of the user.
 */
export function usePracticeDeck(userId: string) {
  const [revealed, setRevealed] = useState(false);
  const { array, currentItem, index, nextIndex, error, reload } = usePracticeArray(userId);
  const { czechHinted, englishHinted, resetHint, plusHint } = useHint(currentItem);
  const {
    playAudio,
    setVolume,
    audioError,
    loading: audioLoading,
  } = useAudioManager(currentItem?.audio);
  const userProgressRef = useRef<UserItemPractice[]>([]);

  const direction: boolean = currentItem ? alternateDirection(currentItem?.progress) : true; // true = CZ -> EN, false = EN -> CZ
  const audioDisabled = (direction && !revealed) || audioError;

  const shouldShowFullCzech = direction || revealed;
  const czech = shouldShowFullCzech ? currentItem?.czech : czechHinted;
  const english = revealed ? currentItem?.english : englishHinted;

  // Save progress on unmount
  useEffect(() => {
    return () => {
      const userProgress = [...userProgressRef.current];
      if (userProgress.length > 0 && userId) {
        (async () => {
          try {
            await UserItem.savePracticeDeck(userId, userProgress);
            infoHandler(`Saved practice deck on unmount with ${userProgress.length} items.`);
          } catch (error) {
            errorHandler('Failed to save practice deck on unmount', error);
          }
        })();
      }
    };
  }, [userId]);

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
        try {
          await UserItem.savePracticeDeck(userId, userProgress);
          infoHandler(`Saved practice deck with ${userProgress.length} items.`);
          userProgressRef.current = [];
          reload();
        } catch (error) {
          errorHandler('Failed to update user progress:', error);
        }
      } else {
        nextIndex();
      }
      setRevealed(false);
      resetHint();
    },
    [currentItem, nextIndex, array.length, reload, userId],
  );

  // Play audio on item change if direction is EN -> CZ and not revealed
  useEffect(() => {
    if (!audioDisabled && !direction && !audioLoading) {
      setTimeout(() => playAudio(), 500);
    }
  }, [playAudio, audioDisabled, direction, audioLoading]);

  return {
    // Core state
    index,
    currentItem,
    grammar_id: currentItem?.grammar_id ?? null,
    progress: currentItem?.progress ?? 0,
    direction,
    revealed,
    setRevealed,
    showGrammar: currentItem?.show_grammar ?? false,

    // Display values
    czech,
    english,
    pronunciation: revealed ? currentItem?.pronunciation || '\u00A0' : '\u00A0',
    audio: currentItem?.audio ?? null,
    audioDisabled,

    // Hinting
    plusHint,

    // Navigation & loading
    nextItem,
    error,

    // Audio management
    audioError,
    setVolume,
    playAudio,
  };
}
