import { useState } from "react";
import type { UserItem } from "../types/data.types";
import { useUserStore } from "./use-user";
import { alternateDirection } from "../utils/practice.utils";
import { getPracticeDeck } from "../services/practice.sevice";
import { useEffect } from "react";

export function useArray() {
  const [array, setArray] = useState<UserItem[]>([]);
  const [index, setIndex] = useState(0);
  const userId = useUserStore((state) => state.userInfo?.id);

  useEffect(() => {
    async function fetchData() {
      if (userId != null && userId !== undefined) {
        const deck = await getPracticeDeck(userId);
        setArray(deck);
      }
    }
    fetchData();
  }, [setArray, userId]);

  const direction = alternateDirection(array[index]?.progress);

  function wrapIndex(newIndex: number) {
    if (array.length === 0) return 0;
    return (newIndex + array.length) % array.length;
  }

  function nextIndex() {
    setIndex((prev) => wrapIndex(prev + 1));
  }

  function prevIndex() {
    setIndex((prev) => wrapIndex(prev - 1));
  }

  return {
    index,
    nextIndex,
    prevIndex,
    currentItem: array[index],
    arrayLength: array.length,
    direction,
  };
}
