import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { supabaseInstance } from '@/config/supabase.config';
import { dataSyncOnUnmount } from '@/database/utils/data-sync.utils';
import { reportError, reportInfo, setMonitoringUser } from '@/features/logging/monitoring-handler';

interface AuthState {
  userId: string | null;
  userEmail: string | null;
  userFullName: string | null;
  isAnonymousUser: boolean;
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
  isAnonymousUser: false,
};

function isAnonymousSession(session: Session | null): boolean {
  const user = session?.user as { is_anonymous?: boolean } | undefined;
  return user?.is_anonymous === true;
}

function isJwtIssuedAtFutureError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const { code, message } = error as { code?: unknown; message?: unknown };
  return code === 'PGRST303' && message === 'JWT issued at future';
}

function isAuthRejectedError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const { code, message, status } = error as {
    code?: unknown;
    message?: unknown;
    status?: unknown;
  };

  return (
    status === 401 ||
    code === 'PGRST301' ||
    (typeof message === 'string' &&
      (message.includes('JWT') || message.toLowerCase().includes('unauthorized')))
  );
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
      isAnonymousUser: isAnonymousSession(session),
      loading: false,
    });
  };

  const clearSession = () => {
    setMonitoringUser(null);
    set({ ...INITIAL_AUTH_STATE, loading: false });
  };

  const recoverJwtIssuedAtFutureSession = async (): Promise<boolean> => {
    reportInfo('Refreshing auth session because Supabase rejected its JWT timestamp.');

    const { data, error } = await supabaseInstance.auth.refreshSession();
    if (!error && data.session) {
      applySession(data.session);
      return true;
    }

    reportInfo('Clearing local auth session because Supabase rejected its JWT timestamp.');

    const { error: signOutError } = await supabaseInstance.auth.signOut({ scope: 'local' });
    if (signOutError && signOutError.message !== 'Auth session missing!') {
      reportError('Invalid auth session cleanup failed', signOutError);
    }

    clearSession();
    return false;
  };

  const recoverRejectedAuthSession = async (): Promise<boolean> => {
    reportInfo('Refreshing auth session because Supabase rejected the stored session.');

    const { data, error } = await supabaseInstance.auth.refreshSession();
    if (!error && data.session) {
      applySession(data.session);
      return true;
    }

    reportInfo('Clearing local auth session because Supabase rejected the stored session.');

    const { error: signOutError } = await supabaseInstance.auth.signOut({ scope: 'local' });
    if (signOutError && signOutError.message !== 'Auth session missing!') {
      reportError('Invalid auth session cleanup failed', signOutError);
    }

    clearSession();
    return false;
  };

  const validateStoredSession = async (session: Session): Promise<Session | null> => {
    const { data, error } = await supabaseInstance.auth.getUser();
    if (!error && data.user?.id === session.user.id) {
      return session;
    }

    if (!error) {
      reportInfo('Refreshing auth session because stored session user mismatch was detected.');
    } else if (!isAuthRejectedError(error)) {
      reportError('Auth session validation failed', error);
      return session;
    }

    const didRecover = await recoverRejectedAuthSession();
    return didRecover ? (await supabaseInstance.auth.getSession()).data.session : null;
  };

  const syncAuthenticatedUserLifecycle = async (hasRecoveredJwt = false, hasRecoveredAuth = false) => {
    // Existing Supabase Auth users do not re-run the auth.users insert trigger on login.
    const { error } = await supabaseInstance.rpc('restore_current_user_if_deleted');
    if (!error) {
      return;
    }

    if (isJwtIssuedAtFutureError(error) && !hasRecoveredJwt) {
      const didRecover = await recoverJwtIssuedAtFutureSession();
      if (didRecover) {
        await syncAuthenticatedUserLifecycle(true);
      }
      return;
    }

    if (isAuthRejectedError(error) && !hasRecoveredAuth) {
      const didRecover = await recoverRejectedAuthSession();
      if (didRecover) {
        await syncAuthenticatedUserLifecycle(hasRecoveredJwt, true);
      }
      return;
    }

    reportError('Auth user lifecycle sync failed', error);
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

        const session = data?.session ? await validateStoredSession(data.session) : null;

        if (session) {
          void syncAuthenticatedUserLifecycle();
        }

        applySession(session);
      };

      fetchSession();

      subscription = supabaseInstance.auth.onAuthStateChange((event, session) => {
        applySession(session);
        if (session && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
          queueMicrotask(() => {
            void syncAuthenticatedUserLifecycle();
          });
        }
      }).data.subscription;

      return () => {
        if (subscription) subscription.unsubscribe();
      };
    },

    handleLogout: async (options) => {
      const currentUserId = useAuthStore.getState().userId;
      if (currentUserId && !options?.skipSync) {
        try {
          await dataSyncOnUnmount(currentUserId);
        } catch (error) {
          reportError('Pre-logout synchronization failed', error);
        }
      }

      if (!options?.skipRemoteSignOut) {
        const { error } = await supabaseInstance.auth.signOut({
          scope: options?.scope ?? 'global',
        });

        if (error && error.message !== 'Auth session missing!') {
          throw new Error(error.message);
        }
      }

      clearSession();
    },
  };
});
