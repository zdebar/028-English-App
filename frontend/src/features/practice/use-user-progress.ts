import { useCallback } from "react";
import UserItem from "@/database/models/user-items";
import type { UserItemLocal } from "@/types/local.types";
import type { UUID } from "crypto";

/**
 * Hook tosave user progress updates to the IndexedDB.
 * @param array Practice deck array of user items.
 * @returns Function to update user items in the database.
 */
export function useUserProgress(userId: UUID) {
  const updateUserItemsInDB = useCallback(
    async (updatedItems: UserItemLocal[]): Promise<boolean> => {
      if (updatedItems.length === 0 || !userId) return false;

      try {
        await UserItem.savePracticeDeck(userId, updatedItems);
        return true;
      } catch (error) {
        console.error("Error updating user items in DB:", error);
        return false;
      }
    },
    [userId]
  );

  return { updateUserItemsInDB };
}
