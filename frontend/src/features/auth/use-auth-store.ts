import { create } from "zustand";
import type { Session } from "@supabase/supabase-js";
import { supabaseInstance } from "@/config/supabase.config";
import type { UUID } from "crypto";

interface AuthState {
  userId: UUID | null;
  userEmail: string | null;
  loading: boolean;
  setSession: (session: Session | null) => void;
  handleLogout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  userEmail: null,
  loading: true,

  setSession: (session) => {
    set({
      userId: (session?.user?.id as UUID) || null,
      userEmail: session?.user?.email || "Anonymní uživatel",
      loading: false,
    });
  },

  handleLogout: async () => {
    const { error } = await supabaseInstance.auth.signOut();
    if (error) {
      console.error("Error logging out:", error.message);
    } else {
      set({ userId: null, userEmail: null });
    }
  },
}));
