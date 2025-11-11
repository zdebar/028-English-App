import { useEffect, useRef, useCallback } from "react";
import { alternateDirection } from "@/utils/practice.utils";
import { useArray } from "@/hooks/use-array";
import { useUserProgress } from "@/hooks/use-user-progress";
import type { UserItemLocal } from "@/types/local.types";

/**
 * Manages the Practice Deck and User Progress.
 */
export function usePracticeDeck(userId: string) {
  const { array, currentItem, index, nextIndex, setReload } = useArray(userId);
  const { updateUserItemsInDB } = useUserProgress(userId);

  const userProgressRef = useRef<UserItemLocal[]>([]);
  const direction = currentItem
    ? alternateDirection(currentItem?.progress)
    : false;
  const grammar_id = currentItem?.grammar_id;

  // Save progress on unmount
  useEffect(() => {
    return () => {
      const userProgress = [...userProgressRef.current];
      if (userProgress.length > 0) {
        updateUserItemsInDB(userProgress).catch((error) => {
          console.error("Failed to save progress on unmount:", error);
        });
      }
    };
  }, [updateUserItemsInDB]);

  // Advance to next item and record progress change
  const nextItem = useCallback(
    async (progressChange: number = 0) => {
      if (!currentItem) {
        console.warn("No current item to update progress for.");
        return;
      }

      const updatedItem = {
        ...currentItem,
        progress: Math.max(currentItem.progress + progressChange, 0),
      };

      userProgressRef.current.push(updatedItem);

      if (userProgressRef.current.length >= array.length) {
        try {
          await updateUserItemsInDB(userProgressRef.current);
          userProgressRef.current = [];
          setReload(true);
        } catch (error) {
          console.error("Failed to update user progress:", error);
        }
      }

      nextIndex();
    },
    [currentItem, nextIndex, array.length, setReload, updateUserItemsInDB]
  );

  return {
    index,
    array,
    nextItem,
    currentItem,
    direction,
    grammar_id,
  };
}
