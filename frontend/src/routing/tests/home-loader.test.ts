import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  userId: 'u1' as string | null,
  waitForAuthReady: vi.fn(),
  ensureDataManagerReady: vi.fn(),
}));

vi.mock('@/features/auth/auth-lifecycle', () => ({
  waitForAuthReady: (...args: unknown[]) => mocks.waitForAuthReady(...args),
}));
vi.mock('@/features/auth/use-auth-store', () => ({
  useAuthStore: { getState: () => ({ userId: mocks.userId }) },
}));
vi.mock('@/database/state/data-store', () => ({
  ensureDataManagerReady: (...args: unknown[]) => mocks.ensureDataManagerReady(...args),
}));

import { loadHomePracticeAvailability } from '../home-loader';

describe('loadHomePracticeAvailability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.userId = 'u1';
    mocks.waitForAuthReady.mockResolvedValue(undefined);
    mocks.ensureDataManagerReady.mockResolvedValue(undefined);
  });

  it('waits for authentication and the active user data snapshot', async () => {
    await expect(loadHomePracticeAvailability()).resolves.toBeNull();

    expect(mocks.waitForAuthReady).toHaveBeenCalledOnce();
    expect(mocks.ensureDataManagerReady).toHaveBeenCalledWith('u1');
  });

  it('does not bootstrap user data when signed out', async () => {
    mocks.userId = null;

    await expect(loadHomePracticeAvailability()).resolves.toBeNull();

    expect(mocks.ensureDataManagerReady).not.toHaveBeenCalled();
  });
});
