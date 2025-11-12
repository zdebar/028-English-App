import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";
import type { UserStatsLocal } from "@/types/local.types";
import UserScore from "@/database/models/user-scores";
import UserItem from "@/database/models/user-items";

interface UserState {
  userStats: UserStatsLocal | null;
  reloadUserScore: (userId: string) => Promise<void>;
}

declare global {
  interface WindowEventMap {
    userItemsUpdated: CustomEvent<{ userId: string }>;
  }
}

/**
 * Zustand store to manage user statistics and score reloading.
 */
export const useUserStore = create<UserState>()(
  devtools(
    persist(
      (set) => {
        const reloadUserScore = async (userId: string) => {
          if (!userId) return;

          try {
            const todayScore = await UserScore.getUserScoreForToday(userId);
            const learnedCounts = await UserItem.getLearnedCounts(userId);

            set({
              userStats: {
                learnedCountToday: learnedCounts?.learnedCountToday || 0,
                learnedCount: learnedCounts?.learnedCount || 0,
                practiceCountToday: todayScore?.item_count || 0,
              },
            });
          } catch (error) {
            console.error(
              `Error reloading user score for userId: ${userId}`,
              error
            );
          }
        };

        // Add event listener for `userItemsUpdated` event
        window.addEventListener("userItemsUpdated", (event) => {
          const { userId } = event.detail;
          if (userId) {
            reloadUserScore(userId);
          }
        });

        return {
          userStats: null,
          reloadUserScore,
        };
      },
      {
        name: "user-store",
      }
    ),
    { name: "UserStore" }
  )
);

/**
 * Hook to access user statistics.
 */
export const useUserStats = () => useUserStore((state) => state.userStats);

/**
 * Hook to manually trigger the reloadUserScore function.
 */
export const useReloadUserScore = () =>
  useUserStore((state) => state.reloadUserScore);
