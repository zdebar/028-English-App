import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserStatsLocal } from "../types/local.types";

interface UserState {
  userScore: UserStatsLocal[] | null;
  loading: boolean;

  setUserScore: (score: UserStatsLocal[] | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      userScore: null,
      loading: true,

      setUserScore: (score) => {
        set({ userScore: score });
      },
      setLoading: (loading) => {
        set({ loading });
      },
    }),
    {
      name: "user-store",
      onRehydrateStorage: () => (state) => {
        if (!state) return;

        if (!state.userScore) {
          state.setUserScore([
            {
              learnedCountToday: 0,
              learnedCountNotToday: 0,
              practiceCountToday: 0,
            },
          ]);
        }

        state.setLoading(false);
      },
    }
  )
);
