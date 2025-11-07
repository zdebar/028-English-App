import { useCallback } from "react";
import UserItem from "@/database/models/user-items";
import UserScore from "@/database/models/user-scores";
import type { UserItemLocal } from "@/types/local.types";

export function useUserProgress(
  array: UserItemLocal[],
  reloadUserScore: () => void
) {
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
      await UserScore.addItemCount(updatedArray.length);
      reloadUserScore();
    },
    [array, reloadUserScore]
  );

  return { updateUserItemsInDB };
}
