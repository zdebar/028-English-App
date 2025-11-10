import { useState, useEffect } from "react";
import UserItem from "@/database/models/user-items";
import type { UserItemLocal } from "@/types/local.types";
import { useAuth } from "@/hooks/use-auth";
import { useFetch } from "@/hooks/user-fetch";

/**
 * Manages the practice deck state and index.
 * @param reload Indicates whether to reload the practice deck.
 * @param setReload Function to set the reload state.
 */
export function usePracticeDeck(
  reload: boolean,
  setReload: (value: boolean) => void
) {
  const [index, setIndex] = useState(0);
  const { userId } = useAuth();

  const {
    data: array,
    error,
    isLoading,
  } = useFetch<UserItemLocal[]>(async () => {
    if (!userId) {
      throw new Error("User ID is required to fetch the practice deck.");
    }
    return await UserItem.getPracticeDeck(userId);
  });

  function wrapIndex(newIndex: number) {
    if (!array || array.length === 0) return 0;
    return newIndex % array.length;
  }

  function nextIndex() {
    setIndex((prev) => wrapIndex(prev + 1));
  }

  useEffect(() => {
    if (reload) {
      setReload(false);
    }
  }, [reload, setReload]);

  return {
    array: array || [],
    index,
    setIndex,
    nextIndex,
    loading: isLoading,
    error,
  };
}
