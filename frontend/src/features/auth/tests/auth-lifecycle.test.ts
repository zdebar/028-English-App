import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const auth = vi.hoisted(() => {
  const listeners = new Set<(state: { userId: string | null; loading: boolean }) => void>();
  const cleanup = vi.fn();
  const initializeAuth = vi.fn(() => cleanup);
  const state = { userId: null as string | null, loading: true, initializeAuth };
  return { cleanup, initializeAuth, listeners, state };
});

vi.mock('@/features/auth/use-auth-store', () => ({
  useAuthStore: {
    getState: () => auth.state,
    subscribe: (listener: (state: { userId: string | null; loading: boolean }) => void) => {
      auth.listeners.add(listener);
      return () => auth.listeners.delete(listener);
    },
  },
}));

import {
  startAuthLifecycle,
  stopAuthLifecycle,
  waitForAuthReady,
} from '@/features/auth/auth-lifecycle';

describe('auth lifecycle bootstrap', () => {
  beforeEach(() => {
    stopAuthLifecycle();
    vi.clearAllMocks();
    auth.listeners.clear();
    auth.state.userId = null;
    auth.state.loading = true;
  });

  afterEach(stopAuthLifecycle);

  it('starts auth once and resolves protected-loader readiness after initial auth settles', async () => {
    const first = startAuthLifecycle();
    const second = waitForAuthReady();
    expect(first).toBe(second);
    expect(auth.initializeAuth).toHaveBeenCalledOnce();

    auth.state.loading = false;
    auth.listeners.forEach((listener) => listener(auth.state));
    await expect(first).resolves.toBeUndefined();
  });

  it('cleans up the auth listener when stopped', () => {
    startAuthLifecycle();
    stopAuthLifecycle();
    expect(auth.cleanup).toHaveBeenCalledOnce();
    expect(auth.listeners.size).toBe(0);
  });
});
