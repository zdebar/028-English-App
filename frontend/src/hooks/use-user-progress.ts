import { useCallback } from "react";
import UserItem from "@/database/models/user-items";
import UserScore from "@/database/models/user-scores";
import type { UserItemLocal } from "@/types/local.types";
import { useAuth } from "@/hooks/use-auth";

/**
 * Hook to manage user progress updates in the database.
 * @param array Practice deck array of user items.
 * @param reloadUserScore Function to reload user score after updates.
 * @returns Function to update user items in the database.
 */
export function useUserProgress(
  array: UserItemLocal[],
  reloadUserScore: () => void
) {
  const { userId } = useAuth();
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
      await UserScore.addItemCount(userId, updatedArray.length);
      reloadUserScore();
    },
    [array, reloadUserScore, userId]
  );

  return { updateUserItemsInDB };
}
