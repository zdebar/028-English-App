import { useCallback } from "react";
import UserItem from "@/database/models/user-items";
import UserScore from "@/database/models/user-scores";
import type { UserItemLocal } from "@/types/local.types";

export function useUserProgress(
  array: UserItemLocal[],
  index: number,
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
      await UserScore.addItemCount(index + 1);
      reloadUserScore();
    },
    [array, reloadUserScore, index]
  );

  return { updateUserItemsInDB };
}
