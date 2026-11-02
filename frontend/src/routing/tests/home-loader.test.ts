import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  userId: 'u1' as string | null,
  waitForAuthReady: vi.fn(),
  ensureDataPackage: vi.fn(),
}));

vi.mock('@/features/auth/auth-lifecycle', () => ({
  waitForAuthReady: (...args: unknown[]) => mocks.waitForAuthReady(...args),
}));
vi.mock('@/features/auth/use-auth-store', () => ({
  useAuthStore: { getState: () => ({ userId: mocks.userId }) },
}));
vi.mock('@/database/state/data-store', () => ({
  ensureDataPackage: (...args: unknown[]) => mocks.ensureDataPackage(...args),
}));

import { loadHomeDataPackage } from '../home-loader';

describe('loadHomeDataPackage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.userId = 'u1';
    mocks.waitForAuthReady.mockResolvedValue(undefined);
    mocks.ensureDataPackage.mockResolvedValue(undefined);
  });

  it('waits for authentication and the home package', async () => {
    await expect(loadHomeDataPackage()).resolves.toBeNull();

    expect(mocks.waitForAuthReady).toHaveBeenCalledOnce();
    expect(mocks.ensureDataPackage).toHaveBeenCalledWith('u1', { kind: 'home' });
  });

  it('does not bootstrap user data when signed out', async () => {
    mocks.userId = null;

    await expect(loadHomeDataPackage()).resolves.toBeNull();

    expect(mocks.ensureDataPackage).not.toHaveBeenCalled();
  });
});
