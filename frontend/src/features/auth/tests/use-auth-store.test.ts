import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChange: vi.fn(),
  rpc: vi.fn(),
  unsubscribe: vi.fn(),
  dataSyncOnUnmount: vi.fn(),
  setMonitoringUser: vi.fn(),
  reportError: vi.fn(),
  reportInfo: vi.fn(),
  authCallback: null as ((event: string, session: any) => void) | null,
}));

vi.mock('@/config/supabase.config', () => ({
  supabaseInstance: {
    auth: {
      getSession: (...args: unknown[]) => mocks.getSession(...args),
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

import { useAuthStore } from '@/features/auth/use-auth-store';

async function flushMicrotasks(): Promise<void> {
  for (let i = 0; i < 5; i += 1) {
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
      loading: true,
    });

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

    cleanup();
  });

  it('initializeAuth keeps session hydration working when reactivation fails', async () => {
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
      error: { message: 'permission denied for function reactivate_user_if_deleted' },
    });

    useAuthStore.getState().initializeAuth();
    await flushMicrotasks();

    const state = useAuthStore.getState();
    expect(state.userId).toBe('u1');
    expect(state.userEmail).toBe('u1@example.com');
    expect(state.userFullName).toBe('User One');
    expect(state.loading).toBe(false);
    expect(mocks.reportError).toHaveBeenCalledWith(
      'Auth reactivation failed',
      expect.objectContaining({
        message: 'permission denied for function reactivate_user_if_deleted',
      }),
    );
  });

  it('initializeAuth clears the local session when Supabase rejects a future JWT', async () => {
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

    useAuthStore.getState().initializeAuth();
    await flushMicrotasks();

    expect(mocks.signOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(mocks.reportInfo).toHaveBeenCalledWith(
      'Clearing local auth session because Supabase rejected its JWT timestamp.',
    );
    expect(mocks.reportError).not.toHaveBeenCalledWith(
      'Auth reactivation failed',
      expect.anything(),
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
