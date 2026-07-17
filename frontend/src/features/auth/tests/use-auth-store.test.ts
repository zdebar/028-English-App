import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  initialize: vi.fn(),
  getUser: vi.fn(),
  refreshSession: vi.fn(),
  setSession: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChange: vi.fn(),
  rpc: vi.fn(),
  unsubscribe: vi.fn(),
  dataSyncOnUnmount: vi.fn(),
  setMonitoringUser: vi.fn(),
  reportError: vi.fn(),
  reportInfo: vi.fn(),
  showToast: vi.fn(),
  authCallback: null as ((event: string, session: any) => void) | null,
}));

vi.mock('@/config/supabase.config', () => ({
  supabaseInstance: {
    auth: {
      getSession: (...args: unknown[]) => mocks.getSession(...args),
      initialize: (...args: unknown[]) => mocks.initialize(...args),
      getUser: (...args: unknown[]) => mocks.getUser(...args),
      refreshSession: (...args: unknown[]) => mocks.refreshSession(...args),
      setSession: (...args: unknown[]) => mocks.setSession(...args),
      signOut: (...args: unknown[]) => mocks.signOut(...args),
      onAuthStateChange: (...args: unknown[]) => mocks.onAuthStateChange(...args),
    },
    rpc: (...args: unknown[]) => mocks.rpc(...args),
  },
}));

vi.mock('@/database/utils/data-sync.utils', () => ({
  dataSyncOnUnmount: (...args: unknown[]) => mocks.dataSyncOnUnmount(...args),
}));

vi.mock('@/features/logging/monitoring-handler', () => ({
  reportError: (...args: unknown[]) => mocks.reportError(...args),
  reportInfo: (...args: unknown[]) => mocks.reportInfo(...args),
  setMonitoringUser: (...args: unknown[]) => mocks.setMonitoringUser(...args),
}));

vi.mock('@/features/toast/use-toast-store', () => ({
  useToastStore: {
    getState: () => ({ showToast: mocks.showToast }),
  },
}));

import { useAuthStore } from '@/features/auth/use-auth-store';
import { saveAnonymousSessionFallback } from '@/features/auth/anonymous-session-fallback';

async function flushMicrotasks(): Promise<void> {
  for (let i = 0; i < 20; i += 1) {
    await Promise.resolve();
  }
}

describe('useAuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useAuthStore.setState({
      userId: null,
      userEmail: null,
      userFullName: null,
      isAnonymousUser: false,
      hasIdentityLinkConflict: false,
      loading: true,
    });

    sessionStorage.clear();
    history.replaceState(null, '', '/');

    mocks.onAuthStateChange.mockImplementation(
      (callback: (event: string, session: any) => void) => {
        mocks.authCallback = callback;
        return {
          data: {
            subscription: {
              unsubscribe: mocks.unsubscribe,
            },
          },
        };
      },
    );
    mocks.signOut.mockResolvedValue({ error: null });
    mocks.initialize.mockResolvedValue({ error: null });
    mocks.getUser.mockResolvedValue({
      data: { user: { id: 'u1' } },
      error: null,
    });
    mocks.refreshSession.mockResolvedValue({ data: { session: null }, error: null });
    mocks.rpc.mockResolvedValue({ error: null });
    mocks.dataSyncOnUnmount.mockResolvedValue(undefined);
  });

  it('initializeAuth loads current session and updates auth state', async () => {
    mocks.getSession.mockResolvedValue({
      data: {
        session: {
          user: {
            id: 'u1',
            email: 'u1@example.com',
            user_metadata: { full_name: 'User One' },
          },
        },
      },
      error: null,
    });

    const cleanup = useAuthStore.getState().initializeAuth();
    await flushMicrotasks();

    const state = useAuthStore.getState();
    expect(state.userId).toBe('u1');
    expect(state.userEmail).toBe('u1@example.com');
    expect(state.userFullName).toBe('User One');
    expect(state.loading).toBe(false);
    expect(mocks.rpc).toHaveBeenCalledWith('restore_current_user_if_deleted');

    cleanup();
  });

  it('does not process a callback after its initialization subscription is cleaned up', async () => {
    let resolveInitialization: ((value: { error: null }) => void) | undefined;
    mocks.initialize.mockReturnValue(
      new Promise<{ error: null }>((resolve) => {
        resolveInitialization = resolve;
      }),
    );

    const cleanup = useAuthStore.getState().initializeAuth();
    cleanup();
    resolveInitialization?.({ error: null });
    await flushMicrotasks();

    expect(mocks.getSession).not.toHaveBeenCalled();
  });

  it('keeps the anonymous session and exposes a collision after identity linking fails', async () => {
    const anonymousSession = {
      access_token: 'guest-access',
      refresh_token: 'guest-refresh',
      user: {
        id: 'u1',
        is_anonymous: true,
        user_metadata: {},
      },
    };
    history.replaceState(
      null,
      '',
      '/?keep=yes&error=server_error&error_code=identity_already_exists&error_description=exists',
    );
    mocks.initialize.mockResolvedValue({
      error: { code: 'identity_already_exists', message: 'Identity already exists' },
    });
    mocks.getSession.mockResolvedValue({ data: { session: anonymousSession }, error: null });

    useAuthStore.getState().initializeAuth();
    await flushMicrotasks();

    const state = useAuthStore.getState();
    expect(state.userId).toBe('u1');
    expect(state.isAnonymousUser).toBe(true);
    expect(state.hasIdentityLinkConflict).toBe(true);
    expect(location.search).toBe('?keep=yes');
    expect(mocks.signOut).not.toHaveBeenCalled();
  });

  it('restores the anonymous session after normal Google sign-in redirect failure', async () => {
    const anonymousSession = {
      access_token: 'guest-access',
      refresh_token: 'guest-refresh',
      user: {
        id: 'u1',
        is_anonymous: true,
        user_metadata: {},
      },
    };
    saveAnonymousSessionFallback(anonymousSession as any);
    history.replaceState(
      null,
      '',
      '/?error=access_denied&error_code=oauth_error&error_description=cancelled',
    );
    const oauthError = { code: 'oauth_error', message: 'Google sign-in cancelled' };
    mocks.initialize.mockResolvedValue({ error: oauthError });
    mocks.setSession.mockResolvedValue({ data: { session: anonymousSession }, error: null });
    mocks.getSession.mockResolvedValue({ data: { session: anonymousSession }, error: null });

    useAuthStore.getState().initializeAuth();
    await flushMicrotasks();

    const state = useAuthStore.getState();
    expect(state.userId).toBe('u1');
    expect(state.isAnonymousUser).toBe(true);
    expect(mocks.setSession).toHaveBeenCalledWith({
      access_token: 'guest-access',
      refresh_token: 'guest-refresh',
    });
    expect(mocks.showToast).toHaveBeenCalledWith(
      expect.stringContaining('Zůstáváte přihlášeni jako host'),
      'error',
    );
    expect(location.search).toBe('');
  });

  it('initializeAuth refreshes and clears a locally cached session rejected by Supabase Auth', async () => {
    mocks.getSession.mockResolvedValue({
      data: {
        session: {
          user: {
            id: 'u1',
            email: 'u1@example.com',
            user_metadata: { full_name: 'User One' },
          },
        },
      },
      error: null,
    });
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'JWT expired', status: 401 },
    });
    mocks.refreshSession.mockResolvedValue({
      data: { session: null },
      error: { message: 'refresh failed' },
    });

    useAuthStore.getState().initializeAuth();
    await flushMicrotasks();

    expect(mocks.refreshSession).toHaveBeenCalled();
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(mocks.rpc).not.toHaveBeenCalled();

    const state = useAuthStore.getState();
    expect(state.userId).toBeNull();
    expect(state.userEmail).toBeNull();
    expect(state.userFullName).toBeNull();
    expect(state.loading).toBe(false);
  });

  it('initializeAuth refreshes and retries lifecycle sync when the RPC rejects auth', async () => {
    const originalSession = {
      user: {
        id: 'u1',
        email: 'u1@example.com',
        user_metadata: { full_name: 'User One' },
      },
    };
    const refreshedSession = {
      user: {
        id: 'u1',
        email: 'u1@example.com',
        user_metadata: { full_name: 'User One' },
      },
    };
    mocks.getSession.mockResolvedValue({
      data: { session: originalSession },
      error: null,
    });
    mocks.rpc
      .mockResolvedValueOnce({
        data: null,
        error: { message: 'JWSError JWSInvalidSignature', status: 401 },
      })
      .mockResolvedValueOnce({ data: false, error: null });
    mocks.refreshSession.mockResolvedValue({
      data: { session: refreshedSession },
      error: null,
    });

    useAuthStore.getState().initializeAuth();
    await flushMicrotasks();

    expect(mocks.refreshSession).toHaveBeenCalled();
    expect(mocks.rpc).toHaveBeenCalledTimes(2);
    expect(mocks.signOut).not.toHaveBeenCalled();
    expect(mocks.reportInfo).toHaveBeenCalledWith(
      'Refreshing auth session because Supabase rejected the stored session.',
    );

    const state = useAuthStore.getState();
    expect(state.userId).toBe('u1');
    expect(state.loading).toBe(false);
  });

  it('initializeAuth keeps session hydration working when user lifecycle sync fails', async () => {
    mocks.getSession.mockResolvedValue({
      data: {
        session: {
          user: {
            id: 'u1',
            email: 'u1@example.com',
            user_metadata: { full_name: 'User One' },
          },
        },
      },
      error: null,
    });
    mocks.rpc.mockResolvedValue({
      data: null,
      error: { message: 'permission denied for function restore_current_user_if_deleted' },
    });

    useAuthStore.getState().initializeAuth();
    await flushMicrotasks();

    const state = useAuthStore.getState();
    expect(state.userId).toBe('u1');
    expect(state.userEmail).toBe('u1@example.com');
    expect(state.userFullName).toBe('User One');
    expect(state.loading).toBe(false);
    expect(mocks.reportError).toHaveBeenCalledWith(
      'Auth user lifecycle sync failed',
      expect.objectContaining({
        message: 'permission denied for function restore_current_user_if_deleted',
      }),
    );
  });

  it('initializeAuth refreshes the local session when Supabase rejects a future JWT', async () => {
    mocks.getSession.mockResolvedValue({
      data: {
        session: {
          user: {
            id: 'u1',
            email: 'u1@example.com',
            user_metadata: { full_name: 'User One' },
          },
        },
      },
      error: null,
    });
    mocks.rpc
      .mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST303', message: 'JWT issued at future' },
      })
      .mockResolvedValueOnce({ data: false, error: null });
    mocks.refreshSession.mockResolvedValue({
      data: {
        session: {
          user: {
            id: 'u1',
            email: 'u1@example.com',
            user_metadata: { full_name: 'User One' },
          },
        },
      },
      error: null,
    });

    useAuthStore.getState().initializeAuth();
    await flushMicrotasks();

    expect(mocks.refreshSession).toHaveBeenCalled();
    expect(mocks.rpc).toHaveBeenCalledTimes(2);
    expect(mocks.signOut).not.toHaveBeenCalled();
    expect(mocks.reportInfo).toHaveBeenCalledWith(
      'Refreshing auth session because Supabase rejected its JWT timestamp.',
    );
    expect(mocks.reportError).not.toHaveBeenCalledWith(
      'Auth user lifecycle sync failed',
      expect.anything(),
    );

    const state = useAuthStore.getState();
    expect(state.userId).toBe('u1');
    expect(state.userEmail).toBe('u1@example.com');
    expect(state.userFullName).toBe('User One');
    expect(state.loading).toBe(false);
  });

  it('initializeAuth clears the local session when future JWT recovery fails', async () => {
    mocks.getSession.mockResolvedValue({
      data: {
        session: {
          user: {
            id: 'u1',
            email: 'u1@example.com',
            user_metadata: { full_name: 'User One' },
          },
        },
      },
      error: null,
    });
    mocks.rpc.mockResolvedValue({
      data: null,
      error: { code: 'PGRST303', message: 'JWT issued at future' },
    });
    mocks.refreshSession.mockResolvedValue({
      data: { session: null },
      error: { message: 'refresh failed' },
    });

    useAuthStore.getState().initializeAuth();
    await flushMicrotasks();

    expect(mocks.refreshSession).toHaveBeenCalled();
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(mocks.reportInfo).toHaveBeenCalledWith(
      'Clearing local auth session because Supabase rejected its JWT timestamp.',
    );

    const state = useAuthStore.getState();
    expect(state.userId).toBeNull();
    expect(state.userEmail).toBeNull();
    expect(state.userFullName).toBeNull();
    expect(state.loading).toBe(false);
  });

  it('initializeAuth clears state when getSession fails', async () => {
    mocks.getSession.mockResolvedValue({ data: { session: null }, error: { message: 'err' } });

    useAuthStore.getState().initializeAuth();
    await flushMicrotasks();

    const state = useAuthStore.getState();
    expect(state.userId).toBeNull();
    expect(state.userEmail).toBeNull();
    expect(state.userFullName).toBeNull();
    expect(state.loading).toBe(false);
  });

  it('applies session updates from auth state change subscription and unsubscribes on cleanup', async () => {
    mocks.getSession.mockResolvedValue({ data: { session: null }, error: null });

    const cleanup = useAuthStore.getState().initializeAuth();
    await flushMicrotasks();

    expect(mocks.authCallback).not.toBeNull();
    mocks.authCallback?.('SIGNED_IN', {
      user: {
        id: 'u2',
        email: 'u2@example.com',
        user_metadata: { name: 'User Two' },
      },
    });

    const state = useAuthStore.getState();
    expect(state.userId).toBe('u2');
    expect(state.userEmail).toBe('u2@example.com');
    expect(state.userFullName).toBe('User Two');

    cleanup();
    expect(mocks.unsubscribe).toHaveBeenCalled();
  });

  it('handleLogout syncs user data, signs out, and clears session', async () => {
    useAuthStore.setState({
      userId: 'u1',
      userEmail: 'u1@example.com',
      userFullName: 'User One',
      loading: false,
    });

    await useAuthStore.getState().handleLogout();

    expect(mocks.dataSyncOnUnmount).toHaveBeenCalledWith('u1');
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: 'global' });

    const state = useAuthStore.getState();
    expect(state.userId).toBeNull();
    expect(state.userEmail).toBeNull();
    expect(state.userFullName).toBeNull();
    expect(state.loading).toBe(false);
  });

  it('handleLogout still signs out and clears state when pre-logout sync fails', async () => {
    const syncError = new Error('Unmount synchronization failed');
    useAuthStore.setState({
      userId: 'u1',
      userEmail: 'u1@example.com',
      userFullName: 'User One',
      loading: false,
    });
    mocks.dataSyncOnUnmount.mockRejectedValue(syncError);

    await useAuthStore.getState().handleLogout();

    expect(mocks.reportError).toHaveBeenCalledWith('Pre-logout synchronization failed', syncError);
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: 'global' });

    const state = useAuthStore.getState();
    expect(state.userId).toBeNull();
    expect(state.userEmail).toBeNull();
    expect(state.userFullName).toBeNull();
    expect(state.loading).toBe(false);
  });

  it('handleLogout throws when signOut fails', async () => {
    useAuthStore.setState({ userId: 'u1', userEmail: 'u1@example.com', userFullName: 'User One' });
    mocks.signOut.mockResolvedValue({ error: { message: 'signout failed' } });

    await expect(useAuthStore.getState().handleLogout()).rejects.toThrow('signout failed');
  });

  it('handleLogout clears local state when remote session is already missing', async () => {
    useAuthStore.setState({ userId: 'u1', userEmail: 'u1@example.com', userFullName: 'User One' });
    mocks.signOut.mockResolvedValue({ error: { message: 'Auth session missing!' } });

    await expect(useAuthStore.getState().handleLogout()).resolves.toBeUndefined();

    const state = useAuthStore.getState();
    expect(state.userId).toBeNull();
    expect(state.userEmail).toBeNull();
    expect(state.userFullName).toBeNull();
    expect(state.loading).toBe(false);
  });

  it('handleLogout skips sync when skipSync option is enabled', async () => {
    useAuthStore.setState({ userId: 'u1', userEmail: 'u1@example.com', userFullName: 'User One' });

    await useAuthStore.getState().handleLogout({ skipSync: true });

    expect(mocks.dataSyncOnUnmount).not.toHaveBeenCalled();
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: 'global' });
  });

  it('handleLogout can clear local auth state without remote signout', async () => {
    useAuthStore.setState({ userId: 'u1', userEmail: 'u1@example.com', userFullName: 'User One' });

    await useAuthStore.getState().handleLogout({ skipSync: true, skipRemoteSignOut: true });

    expect(mocks.dataSyncOnUnmount).not.toHaveBeenCalled();
    expect(mocks.signOut).not.toHaveBeenCalled();

    const state = useAuthStore.getState();
    expect(state.userId).toBeNull();
    expect(state.userEmail).toBeNull();
    expect(state.userFullName).toBeNull();
    expect(state.loading).toBe(false);
  });
});
