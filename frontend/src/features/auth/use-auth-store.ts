import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { supabaseInstance } from '@/config/supabase.config';
import type { UUID } from 'crypto';

interface AuthState {
  userId: UUID | null;
  userEmail: string | null;
  loading: boolean;
  setSession: (session: Session | null) => void;
  handleLogout: () => Promise<void>;
}

/**
 * Zustand store for managing authentication state.
 *
 * Provides:
 * - `userId`: UUID of the authenticated user, or null if not logged in.
 * - `userEmail`: Email of the authenticated user, or null if not logged in.
 * - `loading`: Indicates if authentication state is being determined.
 * - `setSession(session)`: Updates the store with session data from Supabase.
 * - `handleLogout()`: Signs out the user and resets authentication state.
 */
export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  userEmail: null,
  loading: true,

  setSession: (session) => {
    set({
      userId: (session?.user?.id as UUID) || null,
      userEmail: session?.user?.email || null,
      loading: false,
    });
  },

  handleLogout: async () => {
    const { error } = await supabaseInstance.auth.signOut();
    if (error) {
      console.error('Error logging out:', error.message);
    } else {
      set({ userId: null, userEmail: null });
    }
  },
}));
