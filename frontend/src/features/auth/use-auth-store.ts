import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { supabaseInstance } from '@/config/supabase.config';
import { dataSyncOnUnmount } from '@/database/utils/data-sync.utils';
import { reportError, reportInfo, setMonitoringUser } from '@/features/logging/monitoring-handler';
import {
  clearAnonymousSessionFallback,
  clearAuthErrorParameters,
  getAnonymousSessionFallbackIntent,
  restoreAnonymousSessionFallback,
  type AnonymousSessionFallbackIntent,
} from '@/features/auth/anonymous-session-fallback';
import { useToastStore } from '@/features/toast/use-toast-store';
import { TEXTS } from '@/locales/cs';

interface AuthState {
  userId: string | null;
  userEmail: string | null;
  userFullName: string | null;
  isAnonymousUser: boolean;
  hasIdentityLinkConflict: boolean;
  loading: boolean;
  initializeAuth: () => () => void;
  dismissIdentityLinkConflict: () => void;
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
  hasIdentityLinkConflict: false,
};

function getAuthErrorCode(error: unknown): string | null {
  if (typeof error !== 'object' || error === null) {
    return null;
  }

  const candidate = error as { code?: unknown; details?: { code?: unknown } | null };
  if (typeof candidate.code === 'string') {
    return candidate.code;
  }

  return typeof candidate.details?.code === 'string' ? candidate.details.code : null;
}

function isAnonymousSession(session: Session | null): session is Session {
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

type AuthRedirectResolution = Readonly<{
  session?: Session | null;
  shouldOpenIdentityLinkConflict: boolean;
}>;

const CONTINUE_WITH_STORED_SESSION: AuthRedirectResolution = {
  shouldOpenIdentityLinkConflict: false,
};

function showAuthErrorToast(): void {
  useToastStore.getState().showToast(TEXTS.authInitErrorToast, 'error');
}

async function getAnonymousSessionAfterCollision(
  fallbackIntent: AnonymousSessionFallbackIntent | null,
): Promise<Session> {
  if (fallbackIntent === 'link-google-identity') {
    return restoreAnonymousSessionFallback(fallbackIntent);
  }

  const { data, error } = await supabaseInstance.auth.getSession();
  if (error) {
    throw error;
  }
  if (!isAnonymousSession(data.session)) {
    throw new Error('Anonymous session is unavailable after identity collision.');
  }

  return data.session;
}

async function resolveIdentityLinkCollision(
  initializationError: unknown,
  fallbackIntent: AnonymousSessionFallbackIntent | null,
): Promise<AuthRedirectResolution> {
  try {
    const session = await getAnonymousSessionAfterCollision(fallbackIntent);
    reportInfo('Google identity already belongs to another user; guest retained.');
    return { session, shouldOpenIdentityLinkConflict: true };
  } catch (restorationError) {
    clearAnonymousSessionFallback();
    reportError('Google identity linking collision recovery failed', initializationError);
    reportError('Anonymous session collision recovery failed', restorationError);
    showAuthErrorToast();
    return { session: null, shouldOpenIdentityLinkConflict: false };
  }
}

async function resolveFailedGoogleRedirect(
  initializationError: unknown,
  fallbackIntent: AnonymousSessionFallbackIntent,
): Promise<AuthRedirectResolution> {
  try {
    const session = await restoreAnonymousSessionFallback(fallbackIntent);
    reportError(
      'Google authentication redirect failed; anonymous session restored',
      initializationError,
    );
    useToastStore.getState().showToast(TEXTS.existingAccountSigninErrorToast, 'error');
    return { session, shouldOpenIdentityLinkConflict: false };
  } catch (restorationError) {
    reportError('Google authentication redirect failed', initializationError);
    reportError('Anonymous session restoration failed', restorationError);
    showAuthErrorToast();
    return { session: null, shouldOpenIdentityLinkConflict: false };
  }
}

async function resolveAuthRedirect(initializationError: unknown): Promise<AuthRedirectResolution> {
  if (!initializationError) {
    clearAnonymousSessionFallback();
    return CONTINUE_WITH_STORED_SESSION;
  }

  clearAuthErrorParameters();
  const fallbackIntent = getAnonymousSessionFallbackIntent();
  const isLinkCollision =
    getAuthErrorCode(initializationError) === 'identity_already_exists' &&
    (fallbackIntent === null || fallbackIntent === 'link-google-identity');

  if (isLinkCollision) {
    return resolveIdentityLinkCollision(initializationError, fallbackIntent);
  }
  if (fallbackIntent) {
    return resolveFailedGoogleRedirect(initializationError, fallbackIntent);
  }

  reportError('Auth redirect initialization failed', initializationError);
  showAuthErrorToast();
  return CONTINUE_WITH_STORED_SESSION;
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
      ...(!isAnonymousSession(session) ? { hasIdentityLinkConflict: false } : {}),
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

  const loadInitializedSession = async (
    callbackSession: Session | null | undefined,
  ): Promise<Session | null> => {
    let storedSession = callbackSession;
    if (storedSession === undefined) {
      const { data, error } = await supabaseInstance.auth.getSession();
      if (error) {
        throw error;
      }
      storedSession = data?.session ?? null;
    }

    return storedSession ? validateStoredSession(storedSession) : null;
  };

  const applyInitializedSession = (
    session: Session | null,
    redirectResolution: AuthRedirectResolution,
    initializationError: unknown,
  ): void => {
    let shouldOpenConflict = redirectResolution.shouldOpenIdentityLinkConflict;
    if (shouldOpenConflict && !isAnonymousSession(session)) {
      reportError(
        'Anonymous session unavailable after Google identity collision',
        initializationError,
      );
      showAuthErrorToast();
      shouldOpenConflict = false;
    }

    if (session) {
      void syncAuthenticatedUserLifecycle();
    }

    applySession(session);
    if (shouldOpenConflict) {
      set({ hasIdentityLinkConflict: true });
    }
  };

  return {
    ...INITIAL_AUTH_STATE,
    loading: true,

    initializeAuth: () => {
      let subscription: { unsubscribe: () => void } | null = null;
      let isActive = true;

      const fetchSession = async () => {
        const { error: initializationError } = await supabaseInstance.auth.initialize();
        if (!isActive) {
          return;
        }

        const redirectResolution = await resolveAuthRedirect(initializationError);

        if (!isActive) {
          return;
        }

        try {
          const session = await loadInitializedSession(redirectResolution.session);
          applyInitializedSession(session, redirectResolution, initializationError);
        } catch {
          clearSession();
        }
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
        isActive = false;
        if (subscription) subscription.unsubscribe();
      };
    },

    dismissIdentityLinkConflict: () => set({ hasIdentityLinkConflict: false }),

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
