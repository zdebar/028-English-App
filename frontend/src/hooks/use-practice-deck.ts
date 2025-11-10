import { useState, useEffect } from "react";
import UserItem from "@/database/models/user-items";
import type { UserItemLocal } from "@/types/local.types";
import { useAuth } from "@/hooks/use-auth";

/**
 * Manages the practice deck state and index.
 * @param reload Indicates whether to reload the practice deck.
 * @param setReload Function to set the reload state.
 */
export function usePracticeDeck(
  reload: boolean,
  setReload: (value: boolean) => void
) {
  const [array, setArray] = useState<UserItemLocal[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { userId } = useAuth();

  function wrapIndex(newIndex: number) {
    if (array.length === 0) return 0;
    return newIndex % array.length;
  }

  function nextIndex() {
    setIndex((prev) => wrapIndex(prev + 1));
  }

  useEffect(() => {
    if (!reload) return;

    const fetchPracticeDeck = async () => {
      if (!userId) return;

      setLoading(true);
      try {
        const practiceItems = await UserItem.getPracticeDeck(userId);
        setArray(practiceItems);
      } catch (error) {
        console.error("Error fetching practice deck:", error);
        setArray([]);
        setError("Chyba při načítání cvičební sady.");
      } finally {
        setLoading(false);
        setReload(false);
      }
    };

    fetchPracticeDeck();
  }, [userId, reload, setReload]);

  return { array, index, setIndex, nextIndex, loading, error };
}
