import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { supabaseInstance } from '@/config/supabase.config';
import { AuthenticationError } from '@/types/error.types';

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
 * This hook provides access to the current user's authentication state, including user ID, email, and loading status.
 * It also includes methods to initialize authentication and handle logout.
 *
 * @property {string | null} userId - The ID of the authenticated user.
 * @property {string | null} userEmail - The email of the authenticated user.
 * @property {boolean} loading - Indicates if the authentication state is being loaded.
 * @property {() => () => void} initializeAuth - Function to initialize authentication and return a cleanup function.
 * @property {() => Promise<void>} handleLogout - Async function to sign out the user.
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
        throw new AuthenticationError(error.message, error);
      }
      set({ userId: null, userEmail: null, loading: false });
    },
  };
});
