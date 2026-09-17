import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  userId: 'u1' as string | null,
  waitForAuthReady: vi.fn().mockResolvedValue(undefined),
  loadPracticeAvailabilitySnapshot: vi.fn(),
  reportError: vi.fn(),
  showToast: vi.fn(),
}));

vi.mock('@/features/auth/auth-lifecycle', () => ({
  waitForAuthReady: () => mocks.waitForAuthReady(),
}));
vi.mock('@/features/auth/use-auth-store', () => ({
  useAuthStore: {
    getState: () => ({ userId: mocks.userId }),
  },
}));
vi.mock('@/features/practice/practice-availability', () => ({
  loadPracticeAvailabilitySnapshot: (...args: unknown[]) =>
    mocks.loadPracticeAvailabilitySnapshot(...args),
}));
vi.mock('@/features/logging/monitoring-handler', () => ({
  reportError: (...args: unknown[]) => mocks.reportError(...args),
}));
vi.mock('@/features/toast/use-toast-store', () => ({
  useToastStore: {
    getState: () => ({ showToast: mocks.showToast }),
  },
}));

import { loadHome } from '@/routing/home-loader';
import { usePracticeAvailabilityStore } from '@/features/practice/use-practice-availability-store';

describe('loadHome', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.userId = 'u1';
    usePracticeAvailabilityStore.getState().reset();
  });

  it('waits for and stores the availability snapshot before completing', async () => {
    let resolveSnapshot!: (snapshot: object) => void;
    mocks.loadPracticeAvailabilitySnapshot.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveSnapshot = resolve;
      }),
    );

    let completed = false;
    const loading = loadHome().then(() => {
      completed = true;
    });

    await Promise.resolve();
    expect(completed).toBe(false);
    expect(usePracticeAvailabilityStore.getState()).toMatchObject({
      availabilityUserId: 'u1',
      practiceLoading: true,
    });

    resolveSnapshot({
      reviewReadyAt: '2026-07-21T10:00:00.000Z',
      initialTrainingAvailable: true,
      activeSession: null,
      requiresSessionReconciliation: false,
    });
    await loading;

    expect(usePracticeAvailabilityStore.getState()).toMatchObject({
      availabilityUserId: 'u1',
      reviewReadyAt: '2026-07-21T10:00:00.000Z',
      initialTrainingAvailable: true,
      practiceLoading: false,
      practiceError: null,
    });
  });

  it('resets availability for a signed-out user', async () => {
    usePracticeAvailabilityStore.setState({
      availabilityUserId: 'u1',
      reviewReadyAt: '2026-07-21T10:00:00.000Z',
      practiceLoading: false,
    });
    mocks.userId = null;

    await expect(loadHome()).resolves.toBeNull();

    expect(usePracticeAvailabilityStore.getState()).toMatchObject({
      availabilityUserId: null,
      reviewReadyAt: null,
      practiceLoading: true,
    });
    expect(mocks.loadPracticeAvailabilitySnapshot).not.toHaveBeenCalled();
  });

  it('keeps Home navigable with a safe error state when loading fails', async () => {
    const loadError = new Error('availability failed');
    mocks.loadPracticeAvailabilitySnapshot.mockRejectedValueOnce(loadError);

    await expect(loadHome()).resolves.toBeNull();

    expect(usePracticeAvailabilityStore.getState()).toMatchObject({
      availabilityUserId: 'u1',
      practiceLoading: false,
      practiceError: loadError,
      reviewReadyAt: null,
      initialTrainingAvailable: false,
    });
    expect(mocks.reportError).toHaveBeenCalledWith(
      'Failed to load Home practice availability',
      loadError,
    );
    expect(mocks.showToast).toHaveBeenCalledOnce();
  });
});
