import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChange: vi.fn(),
  unsubscribe: vi.fn(),
  dataSyncOnUnmount: vi.fn(),
  authCallback: null as ((event: string, session: any) => void) | null,
}));

vi.mock('@/config/supabase.config', () => ({
  supabaseInstance: {
    auth: {
      getSession: (...args: unknown[]) => mocks.getSession(...args),
      signOut: (...args: unknown[]) => mocks.signOut(...args),
      onAuthStateChange: (...args: unknown[]) => mocks.onAuthStateChange(...args),
    },
  },
}));

vi.mock('@/database/models/data-sync', () => ({
  dataSyncOnUnmount: (...args: unknown[]) => mocks.dataSyncOnUnmount(...args),
}));

import { useAuthStore } from '@/features/auth/use-auth-store';

async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe('useAuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useAuthStore.setState({
      userId: null,
      userEmail: null,
      userFullName: null,
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
    expect(mocks.signOut).toHaveBeenCalled();

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
});
