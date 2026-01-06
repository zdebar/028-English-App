import { useState, useCallback, useEffect } from "react";
import UserItem from "@/database/models/user-items";
import type { UserItemLocal } from "@/types/local.types";
import { useFetch } from "@/hooks/use-fetch";
import type { UUID } from "crypto";

/**
 * useArray hook manages the state and navigation of a practice deck for a given user.
 *
 * @param userId The unique identifier of the user whose practice deck is managed.
 * @returns An object containing the deck array, current item, index, nextIndex function, loading and error states, and setShouldReload function.
 */
export function useArray(userId: UUID) {
  const [array, setArray] = useState<UserItemLocal[]>([]);
  const [index, setIndex] = useState(0);

  function nextIndex() {
    setIndex((prev) => (array.length ? (prev + 1) % array.length : 0));
  }

  const fetchPracticeDeck = useCallback(async () => {
    const data = await UserItem.getPracticeDeck(userId);
    return data.filter((item) => item !== null && item !== undefined);
  }, [userId]);

  const {
    data: fetchedArray,
    error,
    loading,
    setShouldReload,
  } = useFetch<UserItemLocal[]>(fetchPracticeDeck);

  useEffect(() => {
    setArray(fetchedArray || []);
    setIndex(0);
  }, [fetchedArray]);

  return {
    array,
    currentItem: array[index] || null,
    index,
    nextIndex,
    loading,
    error,
    setShouldReload,
  };
}
