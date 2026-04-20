import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  dataSync: vi.fn(),
  audioSync: vi.fn(),
  dataSyncOnUnmount: vi.fn(),
  removeOrphaned: vi.fn(),
  showToast: vi.fn(),
  logRejectedResults: vi.fn(),
  errorHandler: vi.fn(),
}));

vi.mock('@/config/config', () => ({
  default: {
    sync: {
      periodicSyncInterval: 60_000,
    },
  },
}));

vi.mock('@/database/utils/data-sync.utils', () => ({
  dataSync: (...args: unknown[]) => mocks.dataSync(...args),
  audioSync: (...args: unknown[]) => mocks.audioSync(...args),
  dataSyncOnUnmount: (...args: unknown[]) => mocks.dataSyncOnUnmount(...args),
}));

vi.mock('@/database/models/audio-records', () => ({
  default: {
    removeOrphaned: (...args: unknown[]) => mocks.removeOrphaned(...args),
  },
}));

vi.mock('@/features/toast/use-toast-store', () => ({
  useToastStore: (selector: (state: { showToast: typeof mocks.showToast }) => unknown) =>
    selector({ showToast: mocks.showToast }),
}));

vi.mock('@/features/logging/logging.utils', () => ({
  logRejectedResults: (...args: unknown[]) => mocks.logRejectedResults(...args),
}));

vi.mock('@/features/logging/error-handler', () => ({
  errorHandler: (...args: unknown[]) => mocks.errorHandler(...args),
}));

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    syncSuccessToast: 'Sync success',
    syncErrorToast: 'Sync error',
  },
}));

import { usePeriodicSync } from '@/database/hooks/use-periodic-sync';

describe('usePeriodicSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    mocks.dataSync.mockResolvedValue(undefined);
    mocks.audioSync.mockResolvedValue(undefined);
    mocks.dataSyncOnUnmount.mockResolvedValue(undefined);
    mocks.removeOrphaned.mockResolvedValue(undefined);
    mocks.logRejectedResults.mockReturnValue(false);
  });

  afterEach(() => {
    try {
      vi.runOnlyPendingTimers();
    } catch {
      // Ignore pending timer errors during teardown
    }
    vi.useRealTimers();
  });

  it('runs deferred sync and shows success toast when sync succeeds', async () => {
    const { unmount } = renderHook(() => usePeriodicSync('u1'));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(mocks.dataSync).toHaveBeenCalledWith('u1');
    expect(mocks.audioSync).toHaveBeenCalledWith('u1');
    expect(mocks.showToast).toHaveBeenCalledWith('Sync success', 'success');
    expect(mocks.removeOrphaned).toHaveBeenCalled();

    unmount();
  });

  it('shows error toast and logs when settled results contain rejection', async () => {
    mocks.logRejectedResults.mockReturnValue(true);

    const { unmount } = renderHook(() => usePeriodicSync('u1'));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(mocks.showToast).toHaveBeenCalledWith('Sync error', 'error');
    expect(mocks.errorHandler).toHaveBeenCalledWith(
      'Data synchronization failed',
      expect.any(Error),
    );

    unmount();
  });

  it('syncs user data on unmount', async () => {
    const { unmount } = renderHook(() => usePeriodicSync('u1'));

    unmount();

    expect(mocks.dataSyncOnUnmount).toHaveBeenCalledWith('u1');
  });
});
