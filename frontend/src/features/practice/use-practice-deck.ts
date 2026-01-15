import { useEffect, useRef, useCallback } from 'react';
import { alternateDirection } from '@/features/practice/practice.utils';
import { useUserProgress } from '@/features/practice/use-user-progress';
import type { UserItemPractice } from '@/types/local.types';
import { usePracticeArray } from '@/features/practice/use-practice-array';

/**
 * usePracticeDeck hook manages the practice deck and user progress for a given user.
 *
 * @param userId The unique identifier of the user.
 */
export function usePracticeDeck(userId: string) {
  const { updateUserItemsInDB } = useUserProgress(userId);
  const { array, currentItem, index, nextIndex, loading, error, setShouldReload } =
    usePracticeArray(userId);

  const userProgressRef = useRef<UserItemPractice[]>([]);
  const direction = currentItem ? alternateDirection(currentItem?.progress) : false;
  const grammar_id = currentItem?.grammar_id;

  // Save progress on unmount
  useEffect(() => {
    return () => {
      const userProgress = [...userProgressRef.current];
      if (userProgress.length > 0) {
        updateUserItemsInDB(userProgress).catch((error) => {
          console.error('Failed to save progress on unmount:', error);
        });
      }
    };
  }, [updateUserItemsInDB]);

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

      if (userProgressRef.current.length >= (array?.length || 0)) {
        try {
          await updateUserItemsInDB(userProgressRef.current);
          userProgressRef.current = [];
          setShouldReload(true);
        } catch (error) {
          console.error('Failed to update user progress:', error);
        }
      } else {
        nextIndex();
      }
    },
    [currentItem, nextIndex, array?.length, setShouldReload, updateUserItemsInDB],
  );

  return {
    index,
    error,
    loading,
    array,
    nextItem,
    currentItem,
    direction,
    grammar_id,
  };
}
