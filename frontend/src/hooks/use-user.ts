import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";
import type { UserStatsLocal } from "@/types/local.types";
import UserScore from "@/database/models/user-scores";
import UserItem from "@/database/models/user-items";

interface UserState {
  userStats: UserStatsLocal | null;
  reloadUserScore: () => Promise<void>;
}

/**
 * Zustand store to manage user statistics and score reloading.
 */
export const useUserStore = create<UserState>()(
  devtools(
    persist(
      (set) => ({
        userStats: null,

        reloadUserScore: async () => {
          console.log("Reloading user stats...");
          const todayScore = await UserScore.getUserScoreForToday();
          const learnedCounts = await UserItem.getLearnedCounts();
          set({
            userStats: {
              learnedCountToday: learnedCounts?.learnedToday || null,
              learnedCount: learnedCounts?.learned || null,
              practiceCountToday: todayScore?.item_count || null,
            },
          });
        },
      }),
      {
        name: "user-store",
      }
    ),
    { name: "UserStore" }
  )
);

export const useUserStats = () => useUserStore((state) => state.userStats);
export const useReloadUserScore = () =>
  useUserStore((state) => state.reloadUserScore);
