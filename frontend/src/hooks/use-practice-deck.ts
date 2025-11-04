import { useState, useEffect } from "react";
import UserItem from "@/database/models/user-items";
import { db } from "@/database/models/db";
import type { UserItemLocal } from "@/types/local.types";

export function usePracticeDeck(
  reload: boolean,
  setReload: (value: boolean) => void
) {
  const [array, setArray] = useState<UserItemLocal[]>([]);
  const [index, setIndex] = useState(0);

  function wrapIndex(newIndex: number) {
    if (array.length === 0) return 0;
    return (newIndex + array.length) % array.length;
  }

  function nextIndex() {
    setIndex((prev) => wrapIndex(prev + 1));
  }

  useEffect(() => {
    if (!reload || !db.userId) return;

    const fetchPracticeDeck = async () => {
      const practiceItems = await UserItem.getPracticeDeck();
      console.log("Fetched practice deck:", practiceItems);
      setArray(practiceItems);
      setReload(false);
    };

    fetchPracticeDeck();
  }, [reload, setReload]);

  return { array, index, setIndex, nextIndex };
}
