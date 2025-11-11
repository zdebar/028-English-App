import { useState, useCallback } from "react";
import UserItem from "@/database/models/user-items";
import type { UserItemLocal } from "@/types/local.types";
import { useFetch } from "@/hooks/use-fetch";

/**
 * Manages the practice deck state and index.
 * @param reload Indicates whether to reload the practice deck.
 * @param setReload Function to set the reload state.
 */
export function useArray(userId: string) {
  const [index, setIndex] = useState(0);

  const fetchPracticeDeck = useCallback(async () => {
    const data = await UserItem.getPracticeDeck(userId);
    return data.filter((item) => item !== null && item !== undefined);
  }, [userId]);

  const {
    data: array,
    error,
    loading,
    setReload,
  } = useFetch<UserItemLocal[]>(fetchPracticeDeck);

  function wrapIndex(newIndex: number) {
    if (!array || array.length === 0) return 0;
    return newIndex % array.length;
  }

  function nextIndex() {
    setIndex((prev) => wrapIndex(prev + 1));
  }

  return {
    array: array || [],
    currentItem: array?.[index] || null,
    index,
    nextIndex,
    loading,
    error,
    setReload,
  };
}
