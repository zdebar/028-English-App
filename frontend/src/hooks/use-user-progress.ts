import { useCallback } from "react";
import UserItem from "@/database/models/user-items";
import UserScore from "@/database/models/user-scores";
import type { UserItemLocal } from "@/types/local.types";
import { useUserStore } from "@/hooks/use-user";

/**
 * Hook tosave user progress updates to the IndexedDB.
 * @param array Practice deck array of user items.
 * @param reloadUserScore Function to reload user score after updates.
 * @returns Function to update user items in the database.
 */
export function useUserProgress(userId: string) {
  const { reloadUserScore } = useUserStore();

  const updateUserItemsInDB = useCallback(
    async (updatedItems: UserItemLocal[]): Promise<boolean> => {
      if (updatedItems.length === 0 || !userId) return false;

      try {
        await UserItem.savePracticeDeck(updatedItems);
        await UserScore.addItemCount(userId, updatedItems.length);
        reloadUserScore(userId);
        return true;
      } catch (error) {
        console.error("Error updating user items in DB:", error);
        return false;
      }
    },
    [reloadUserScore, userId]
  );

  return { updateUserItemsInDB };
}
