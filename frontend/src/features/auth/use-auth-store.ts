import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { supabaseInstance } from '@/config/supabase.config';
import { dataSyncOnUnmount } from '@/database/models/data-sync';

interface AuthState {
  userId: string | null;
  userEmail: string | null;
  userFullName: string | null;
  loading: boolean;
  initializeAuth: () => () => void;
  handleLogout: () => Promise<void>;
}

const INITIAL_AUTH_STATE = {
  userId: null,
  userEmail: null,
  userFullName: null,
};

/**
 * A Zustand store hook for managing authentication state using Supabase.
 *
 * This hook provides state and methods to handle user authentication, including
 * initializing auth listeners, fetching the current session, and logging out.
 *
 * @returns An object containing the authentication state and methods:
 * - `userId`: The ID of the authenticated user, or null if not authenticated.
 * - `userEmail`: The email of the authenticated user, or null if not authenticated.
 * - `userFullName`: The full name of the authenticated user, or null if not available.
 * - `loading`: A boolean indicating if the authentication state is being initialized.
 * - `initializeAuth`: A function that sets up authentication listeners and fetches the initial session.
 *   Returns a cleanup function to unsubscribe from listeners.
 * - `handleLogout`: An async function that signs out the user and resets the state.
 *   Throws an error if sign-out fails.
 */
export const useAuthStore = create<AuthState>((set) => {
  const applySession = (session: Session | null) => {
    set({
      userId: session?.user?.id ?? null,
      userEmail: session?.user?.email ?? null,
      userFullName:
        session?.user?.user_metadata?.full_name || session?.user?.user_metadata?.name || null,
      loading: false,
    });
  };

  const clearSession = () => {
    set({ ...INITIAL_AUTH_STATE, loading: false });
  };

  return {
    ...INITIAL_AUTH_STATE,
    loading: true,

    initializeAuth: () => {
      let subscription: { unsubscribe: () => void } | null = null;

      const fetchSession = async () => {
        const { data, error } = await supabaseInstance.auth.getSession();
        if (error) {
          clearSession();
          return;
        }
        applySession(data.session);
      };

      void fetchSession();

      subscription = supabaseInstance.auth.onAuthStateChange((_event, session) => {
        applySession(session);
      }).data.subscription;

      return () => {
        if (subscription) subscription.unsubscribe();
      };
    },

    handleLogout: async () => {
      const currentUserId = useAuthStore.getState().userId;
      if (currentUserId) {
        await dataSyncOnUnmount(currentUserId);
      }

      const { error } = await supabaseInstance.auth.signOut();
      if (error) {
        throw new Error(error.message);
      }
      clearSession();
    },
  };
});
