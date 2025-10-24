import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import type { UserInfo, UserScore } from "../types/data.types";

interface UserState {
  userInfo: UserInfo | null;
  userScore: UserScore[] | null;
  loading: boolean;
  setUserInfo: (user: UserInfo | null) => void;
  setUserScore: (score: UserScore[] | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      userInfo: {
        id: null,
        uid: uuidv4(),
        username: null,
        picture: null,
      },
      userScore: null,
      loading: true,
      setUserInfo: (user) => set({ userInfo: user }),
      setUserScore: (score) => set({ userScore: score }),
      setLoading: (loading) => set({ loading }),
    }),
    {
      name: "user-store",
      partialize: (state) => ({
        userInfo: state.userInfo,
        userScore: state.userScore,
      }),
    }
  )
);
