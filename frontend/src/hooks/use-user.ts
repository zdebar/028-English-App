import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserStatsLocal } from "@/types/local.types";
import UserScore from "@/database/models/user-scores";
import UserItem from "@/database/models/user-items";

interface UserState {
  userScore: UserStatsLocal[] | null;
  setUserScore: (score: UserStatsLocal[] | null) => void;
  reloadUserScore: () => Promise<void>;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      userScore: null,

      setUserScore: (score) => {
        set({ userScore: score });
      },

      reloadUserScore: async () => {
        const todayScore = await UserScore.getUserScoreForToday();
        const learnedCounts = await UserItem.getLearnedCounts();

        set({
          userScore: [
            {
              learnedCountToday: learnedCounts?.learnedToday || 0,
              learnedCount: learnedCounts?.learned || 0,
              practiceCountToday: todayScore?.item_count || 0,
            },
          ],
        });
      },
    }),
    {
      name: "user-store",
      onRehydrateStorage: () => async (state) => {
        if (!state) return;

        if (!state.userScore) {
          const todayScore = await UserScore.getUserScoreForToday();
          const learnedCounts = await UserItem.getLearnedCounts();
          state.setUserScore([
            {
              learnedCountToday: learnedCounts?.learnedToday || 0,
              learnedCount: learnedCounts?.learned || 0,
              practiceCountToday: todayScore?.item_count || 0,
            },
          ]);
        }
      },
    }
  )
);
