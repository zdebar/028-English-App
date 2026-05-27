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
  loginDemoWithCaptcha: (captchaToken: string) => Promise<void>;
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

async function mapDemoAuthErrorCode(response?: Response): Promise<string> {
  if (!response) {
    return 'DEMO_AUTH_FAILED';
  }

  const status = response.status;
  let detail = '';

  try {
    const payload = (await response.clone().json()) as {
      detail?: string;
      error?: string;
      msg?: string;
    };
    detail = `${payload.detail ?? ''} ${payload.error ?? ''} ${payload.msg ?? ''}`.toLowerCase();
  } catch {
    try {
      detail = (await response.clone().text()).toLowerCase();
    } catch {
      detail = '';
    }
  }

  if (status === 429) {
    return 'RATE_LIMIT';
  }
  if (status === 403) {
    return 'CAPTCHA_FAILED';
  }
  if (status === 400 || status === 401) {
    if (detail.includes('captcha_failed') || detail.includes('captcha_token')) {
      return 'CAPTCHA_FAILED';
    }
    if (detail.includes('invalid login credentials') || detail.includes('invalid_grant')) {
      return 'DEMO_INVALID_CREDENTIALS';
    }
    if (detail.includes('email') && detail.includes('disabled')) {
      return 'DEMO_EMAIL_PROVIDER_DISABLED';
    }
    const shortDetail = detail.replace(/\s+/g, ' ').trim().slice(0, 180);
    return shortDetail ? `DEMO_AUTH_FAILED:${shortDetail}` : 'DEMO_AUTH_FAILED';
  }

  return 'DEMO_AUTH_FAILED';
}

function isDemoSession(session: Session | null): boolean {
  const appMetadata = session?.user?.app_metadata as { is_demo?: boolean } | undefined;
  return appMetadata?.is_demo === true;
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

    loginDemoWithCaptcha: async (captchaToken: string) => {
      const token = captchaToken.trim();
      if (!token) {
        throw new Error('Missing captcha token');
      }

      const { data, error } = await supabaseInstance.functions.invoke('demo-session', {
        body: { captchaToken: token },
      });

      if (error) {
        const invokeError = error as { context?: Response };
        const mapped = await mapDemoAuthErrorCode(invokeError.context);
        throw new Error(mapped || error.message);
      }

      const payload = data as {
        access_token?: string;
        refresh_token?: string;
      } | null;

      const accessToken = payload?.access_token ?? '';
      const refreshToken = payload?.refresh_token ?? '';

      if (!accessToken || !refreshToken) {
        throw new Error('Invalid demo session payload');
      }

      const { error: setSessionError } = await supabaseInstance.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (setSessionError) {
        throw new Error(setSessionError.message);
      }
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
        throw new Error(error.message);
      }
      clearSession();
    },
  };
});
