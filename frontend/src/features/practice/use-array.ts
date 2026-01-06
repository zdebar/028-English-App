import { useState, useCallback, useEffect } from "react";
import UserItem from "@/database/models/user-items";
import type { UserItemLocal } from "@/types/local.types";
import { useFetch } from "@/hooks/use-fetch";
import type { UUID } from "crypto";

/**
 * Manages the practice deck state and index.
 * @param reload Indicates whether to reload the practice deck.
 * @param setShouldReload Function to set the reload state.
 */
export function useArray(userId: UUID) {
  const [index, setIndex] = useState(0);

  function nextIndex() {
    setIndex((prev) => wrapIndex(prev + 1));
  }

  const fetchPracticeDeck = useCallback(async () => {
    const data = await UserItem.getPracticeDeck(userId);
    return data.filter((item) => item !== null && item !== undefined);
  }, [userId]);

  const {
    data: array,
    error,
    loading,
    setShouldReload,
  } = useFetch<UserItemLocal[]>(async () => {
    const deck = await fetchPracticeDeck();
    return deck;
  });

  useEffect(() => {
    setIndex(0);
  }, [array]);

  function wrapIndex(newIndex: number) {
    if (!array || array.length === 0) return 0;
    return newIndex % array.length;
  }

  return {
    array: array || [],
    currentItem: array?.[index] || null,
    index,
    nextIndex,
    loading,
    error,
    setShouldReload,
  };
}
