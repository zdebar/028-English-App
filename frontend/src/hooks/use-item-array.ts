import { useState, useEffect, useRef } from "react";
import { alternateDirection } from "@/utils/practice.utils";
import { usePracticeDeck } from "@/hooks/use-practice-deck";
import { useUserProgress } from "@/hooks/use-user-progress";

/**
 * Manages the Practice Deck and User Progress.
 */
export function useItemArray(userId: string) {
  const { array, index, nextIndex, setReload } = usePracticeDeck(userId);
  const { updateUserItemsInDB } = useUserProgress(userId, array);
  const [userProgress, setUserProgress] = useState<number[]>([]);
  const patchRef = useRef(updateUserItemsInDB);
  const updateArrayRef = useRef(userProgress);

  useEffect(() => {
    patchRef.current = updateUserItemsInDB;
  }, [updateUserItemsInDB]);

  useEffect(() => {
    updateArrayRef.current = userProgress;
  }, [userProgress]);

  // Save progress on unmount
  useEffect(() => {
    return () => {
      if (updateArrayRef.current.length > 0) {
        patchRef.current(updateArrayRef.current);
      }
    };
  }, []);

  const currentItem = array[index] || null;
  const direction = alternateDirection(currentItem?.progress || 0);
  const hasGrammar = !!currentItem?.grammar_id;

  return {
    array,
    index,
    nextIndex,
    currentItem,
    arrayLength: array.length,
    direction,
    hasGrammar,
    userProgress,
    setUserProgress,
    patchItems: updateUserItemsInDB,
    setReload,
  };
}
