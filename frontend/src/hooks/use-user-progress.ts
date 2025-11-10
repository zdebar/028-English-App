import { useCallback } from "react";
import UserItem from "@/database/models/user-items";
import UserScore from "@/database/models/user-scores";
import type { UserItemLocal } from "@/types/local.types";
import { useAuth } from "@/hooks/use-auth";
import { useUserStore } from "@/hooks/use-user";

/**
 * Hook to manage user progress updates in the database.
 * @param array Practice deck array of user items.
 * @param reloadUserScore Function to reload user score after updates.
 * @returns Function to update user items in the database.
 */
export function useUserProgress(array: UserItemLocal[]) {
  const { userId } = useAuth();
  const { reloadUserScore } = useUserStore();

  const updateUserItemsInDB = useCallback(
    async (updatedProgress: number[]): Promise<boolean> => {
      if (array.length === 0 || updatedProgress.length === 0 || !userId)
        return false;
      try {
        const updatedArray = array
          .filter((_, idx) => idx < updatedProgress.length)
          .map((item, idx) => ({
            ...item,
            progress: updatedProgress[idx],
          }));

        await UserItem.savePracticeDeck(updatedArray);
        await UserScore.addItemCount(userId, updatedArray.length);
        reloadUserScore(userId);
        return true;
      } catch (error) {
        console.error("Error updating user items in DB:", error);
        return false;
      }
    },
    [array, reloadUserScore, userId]
  );

  return { updateUserItemsInDB };
}
