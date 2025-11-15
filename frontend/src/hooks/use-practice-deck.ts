import { useEffect, useRef, useCallback, useState } from "react";
import { alternateDirection } from "@/utils/practice.utils";
import { useUserProgress } from "@/hooks/use-user-progress";
import type { UserItemLocal } from "@/types/local.types";
import UserItem from "@/database/models/user-items";
import { useFetch } from "@/hooks/use-fetch";
import type { UUID } from "crypto";

/**
 * Manages the Practice Deck and User Progress.
 */
export function usePracticeDeck(userId: UUID) {
  const { updateUserItemsInDB } = useUserProgress(userId);
  const [index, setIndex] = useState(0);

  const fetchPracticeDeck = useCallback(async () => {
    const data = await UserItem.getPracticeDeck(userId);
    return data.filter((item) => item !== null && item !== undefined);
  }, [userId]);

  const {
    data: array = [],
    error,
    loading,
    setReload,
  } = useFetch<UserItemLocal[]>(fetchPracticeDeck);

  const userProgressRef = useRef<UserItemLocal[]>([]);
  const currentItem = array?.[index] || null;
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

  const wrapIndex = useCallback(
    (newIndex: number) => {
      if (!array || array.length === 0) return 0;
      return newIndex % array.length;
    },
    [array]
  );

  const nextIndex = useCallback(() => {
    setIndex((prev) => wrapIndex(prev + 1));
  }, [wrapIndex]);

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

      if (userProgressRef.current.length >= (array?.length || 0)) {
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
    [currentItem, nextIndex, array?.length, setReload, updateUserItemsInDB]
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
