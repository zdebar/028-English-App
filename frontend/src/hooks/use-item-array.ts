import { useState, useEffect, useRef } from "react";
import { alternateDirection } from "@/utils/practice.utils";
import { useUserStore } from "@/hooks/use-user";
import { usePracticeDeck } from "@/hooks/use-practice-deck";
import { useUserProgress } from "@/hooks/use-user-progress";

/**
 * Manages the Practice Deck and User Progress.
 */
export function useItemArray() {
  const [reload, setReload] = useState(true);
  const { reloadUserScore } = useUserStore();
  const { array, index, setIndex, nextIndex } = usePracticeDeck(
    reload,
    setReload
  );
  const { updateUserItemsInDB } = useUserProgress(array, reloadUserScore);
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

  const currentItem = array[index];
  const direction = alternateDirection(currentItem?.progress);
  const hasGrammar = !!currentItem?.grammar_id;

  return {
    array,
    index,
    setIndex,
    nextIndex,
    currentItem,
    arrayLength: array.length,
    direction,
    hasGrammar,
    userProgress,
    setUserProgress,
    patchItems: updateUserItemsInDB,
    reload,
    setReload,
  };
}
