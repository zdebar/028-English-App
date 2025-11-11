import { useState, useCallback } from "react";
import UserItem from "@/database/models/user-items";
import type { UserItemLocal } from "@/types/local.types";
import { useFetch } from "@/hooks/use-fetch";

/**
 * Manages the practice deck state and index.
 * @param reload Indicates whether to reload the practice deck.
 * @param setReload Function to set the reload state.
 */
export function usePracticeDeck(userId: string) {
  const [index, setIndex] = useState(0);

  const fetchPracticeDeck = useCallback(async () => {
    return await UserItem.getPracticeDeck(userId);
  }, [userId]);

  const {
    data: array,
    error,
    isLoading,
    setReload,
  } = useFetch<UserItemLocal[]>(fetchPracticeDeck);

  function wrapIndex(newIndex: number) {
    const safeArray = array || [];
    if (safeArray.length === 0) return 0;
    return newIndex % safeArray.length;
  }

  function nextIndex() {
    setIndex((prev) => wrapIndex(prev + 1));
  }

  return {
    array: array || [],
    index,
    nextIndex,
    loading: isLoading,
    error,
    setReload,
  };
}
