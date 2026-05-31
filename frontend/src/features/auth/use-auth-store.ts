import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { supabaseInstance } from '@/config/supabase.config';
import { dataSyncOnUnmount } from '@/database/utils/data-sync.utils';
import { setMonitoringUser } from '@/features/logging/monitoring-handler';

interface AuthState {
  userId: string | null;
  userEmail: string | null;
  userFullName: string | null;
  isDemoUser: boolean;
  loading: boolean;
  initializeAuth: () => () => void;
  handleLogout: (options?: {
    skipSync?: boolean;
    scope?: 'global' | 'local';
    skipRemoteSignOut?: boolean;
  }) => Promise<void>;
}

const INITIAL_AUTH_STATE = {
  userId: null,
  userEmail: null,
  userFullName: null,
  isDemoUser: false,
};

function isDemoSession(session: Session | null): boolean {
  const appMetadata = session?.user?.app_metadata as { is_demo?: boolean } | undefined;
  return appMetadata?.is_demo === true;
}

function isMissingAuthSessionError(message: string | undefined): boolean {
  if (!message) return false;

  const normalized = message.trim().toLowerCase();
  return normalized.includes('auth session missing');
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
 * - `userFullName`: The full name of the authenticated user, or null if not available.
 * - `loading`: A boolean indicating if the authentication state is being initialized.
 * - `initializeAuth`: A function that sets up authentication listeners and fetches the initial session.
 *   Returns a cleanup function to unsubscribe from listeners.
 * - `handleLogout`: An async function that signs out the user and resets the state.
 *   Throws an error if sign-out fails.
 */
export const useAuthStore = create<AuthState>((set) => {
  const applySession = (session: Session | null) => {
    const nextUserId = session?.user?.id ?? null;
    setMonitoringUser(nextUserId);

    set({
      userId: nextUserId,
      userEmail: session?.user?.email ?? null,
      userFullName:
        session?.user?.user_metadata?.full_name || session?.user?.user_metadata?.name || null,
      isDemoUser: isDemoSession(session),
      loading: false,
    });
  };

  const clearSession = () => {
    setMonitoringUser(null);
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

      fetchSession();

      subscription = supabaseInstance.auth.onAuthStateChange((_event, session) => {
        applySession(session);
      }).data.subscription;

      return () => {
        if (subscription) subscription.unsubscribe();
      };
    },

    handleLogout: async (options) => {
      const currentUserId = useAuthStore.getState().userId;
      if (currentUserId && !options?.skipSync) {
        await dataSyncOnUnmount(currentUserId);
      }

      if (options?.skipRemoteSignOut) {
        clearSession();
        return;
      }

      const { error } = await supabaseInstance.auth.signOut({
        scope: options?.scope ?? 'global',
      });
      if (error) {
        if (isMissingAuthSessionError(error.message)) {
          clearSession();
          return;
        }
        throw new Error(error.message);
      }
      clearSession();
    },
  };
});
