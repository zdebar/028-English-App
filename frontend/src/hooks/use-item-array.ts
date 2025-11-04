import { useState, useCallback, useEffect } from "react";
import { alternateDirection } from "@/utils/practice.utils";
import { useUserStore } from "@/hooks/use-user";
import { useSaveOnUnmount } from "@/hooks/use-patch-on-unmount";
import UserItem from "@/database/models/user-items";
import type { UserItemLocal } from "@/types/local.types";
import UserScore from "@/database/models/user-scores";
import { db } from "@/database/models/db";

export function useItemArray() {
  const [userProgress, setUserProgress] = useState<number[]>([]);
  const { reloadUserScore } = useUserStore();
  const [array, setArray] = useState<UserItemLocal[]>([]);
  const [index, setIndex] = useState(0);
  const [reload, setReload] = useState(true);

  const currentItem = array[index];
  const direction = alternateDirection(currentItem?.progress);
  const hasGrammar = currentItem?.grammar_id;

  function wrapIndex(newIndex: number) {
    if (array.length === 0) return 0;
    return (newIndex + array.length) % array.length;
  }

  function nextIndex() {
    setIndex((prev) => wrapIndex(prev + 1));
  }

  useEffect(() => {
    if (!reload) return;

    const interval = setInterval(async () => {
      if (db.userId) {
        const practiceItems = await UserItem.getPracticeDeck();
        setArray(practiceItems);
        clearInterval(interval);
      }
      setReload(false);
    }, 100);

    return () => clearInterval(interval);
  }, [reload]);

  const updateUserItemsInDB = useCallback(
    async (updatedProgress: number[]) => {
      if (array.length === 0) return;
      const updatedArray = array
        .filter((_, idx) => idx < updatedProgress.length)
        .map((item, idx) => ({
          ...item,
          progress: updatedProgress[idx],
        }));

      if (updatedArray.length === 0) return;
      await UserItem.savePracticeDeck(updatedArray);
      await UserScore.addItemCount(index + 1);
      setUserProgress([]);
      reloadUserScore();
    },
    [array, reloadUserScore, index]
  );

  useSaveOnUnmount(updateUserItemsInDB, userProgress);

  return {
    array,
    index,
    setIndex,
    nextIndex,
    currentItem,
    arrayLength: array.length,
    direction,
    hasGrammar,
    userProgress,
    setUserProgress,
    patchItems: updateUserItemsInDB,
    reload,
    setReload,
  };
}
