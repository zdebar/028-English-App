import UserItem from '@/database/models/user-items';

import { useFetch } from '@/hooks/use-fetch';
import type { UserItemPractice } from '@/types/local.types';
import { useCallback, useEffect, useState } from 'react';

/**
 * useArray hook manages the state and navigation of a practice deck array for a given user.
 *
 * @param userId The unique identifier of the user whose practice deck is managed.
 * @returns An object containing the deck array, current item, index, nextIndex function, loading and error states, and setShouldReload function.
 */
export function usePracticeArray(userId: string) {
  const [array, setArray] = useState<UserItemPractice[]>([]);
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
    reload,
  } = useFetch<UserItemPractice[]>(fetchPracticeDeck);

  useEffect(() => {
    setArray(fetchedArray || []);
    setIndex(0);
  }, [fetchedArray]);

  return {
    array,
    currentItem: array[index] ?? null,
    index,
    nextIndex,
    loading,
    error,
    reload,
  };
}
