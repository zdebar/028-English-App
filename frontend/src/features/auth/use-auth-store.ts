import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { supabaseInstance } from '@/config/supabase.config';

interface AuthState {
  userId: string | null;
  userEmail: string | null;
  loading: boolean;
  initializeAuth: () => () => void;
  handleLogout: () => Promise<void>;
}

/**
 * A Zustand store hook for managing authentication state using Supabase.
 *
 * This hook provides state and methods to handle user authentication, including
 * initializing auth listeners, fetching the current session, and logging out.
 *
 * @returns An object containing the authentication state and methods:
 * - `userId`: The ID of the authenticated user, or null if not authenticated.
 * - `userEmail`: The email of the authenticated user, or null if not authenticated.
 * - `loading`: A boolean indicating if the authentication state is being initialized.
 * - `initializeAuth`: A function that sets up authentication listeners and fetches the initial session.
 *   Returns a cleanup function to unsubscribe from listeners.
 * - `handleLogout`: An async function that signs out the user and resets the state.
 *   Throws an error if sign-out fails.
 */
export const useAuthStore = create<AuthState>((set) => {
  const setSession = (session: Session | null) => {
    set({
      userId: session?.user?.id ?? null,
      userEmail: session?.user?.email ?? null,
      loading: false,
    });
  };

  return {
    userId: null,
    userEmail: null,
    loading: true,

    initializeAuth: () => {
      let subscription: { unsubscribe: () => void } | null = null;

      const fetchSession = async () => {
        const { data, error } = await supabaseInstance.auth.getSession();
        if (error) {
          setSession(null);
        } else {
          setSession(data.session);
        }
      };

      fetchSession();

      subscription = supabaseInstance.auth.onAuthStateChange((_event, session) => {
        setSession(session);
      }).data.subscription;

      return () => {
        if (subscription) subscription.unsubscribe();
      };
    },

    handleLogout: async () => {
      const { error } = await supabaseInstance.auth.signOut();
      if (error) {
        throw new Error(error.message);
      }
      set({ userId: null, userEmail: null, loading: false });
    },
  };
});
