import { useState, useEffect } from "react";
import UserItem from "@/database/models/user-items";
import type { UserItemLocal } from "@/types/local.types";

export function usePracticeDeck(
  reload: boolean,
  setReload: (value: boolean) => void
) {
  const [array, setArray] = useState<UserItemLocal[]>([]);
  const [index, setIndex] = useState(0);

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
      const practiceItems = await UserItem.getPracticeDeck();
      setArray(practiceItems);
      setReload(false);
    };

    fetchPracticeDeck();
  }, [reload, setReload]);

  return { array, index, setIndex, nextIndex };
}
