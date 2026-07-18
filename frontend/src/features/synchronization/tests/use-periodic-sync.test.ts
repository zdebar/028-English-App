import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSyncStore } from '@/features/synchronization/use-sync-store';

const mocks = vi.hoisted(() => ({
  dataSync: vi.fn(),
  dataSyncOnUnmount: vi.fn(),
  syncFromRemote: vi.fn(),
  removeOrphaned: vi.fn(),
  showToast: vi.fn(),
  reportError: vi.fn(),
  reportInfo: vi.fn(),
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
  dataSyncOnUnmount: (...args: unknown[]) => mocks.dataSyncOnUnmount(...args),
}));

vi.mock('@/database/models/audio-records', () => ({
  default: {
    syncFromRemote: (...args: unknown[]) => mocks.syncFromRemote(...args),
    removeOrphaned: (...args: unknown[]) => mocks.removeOrphaned(...args),
  },
}));

vi.mock('@/features/toast/use-toast-store', () => ({
  useToastStore: (selector: (state: { showToast: typeof mocks.showToast }) => unknown) =>
    selector({ showToast: mocks.showToast }),
}));

vi.mock('@/features/logging/monitoring-handler', () => ({
  reportError: (...args: unknown[]) => mocks.reportError(...args),
  reportInfo: (...args: unknown[]) => mocks.reportInfo(...args),
}));

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    syncSuccessToast: 'Sync success',
    syncErrorToast: 'Sync error',
  },
}));

import { usePeriodicSync } from '@/features/synchronization/use-periodic-sync';

describe('usePeriodicSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    useSyncStore.setState({
      isSynchronized: false,
      isSynchronizing: false,
      isSyncError: false,
    });

    mocks.dataSync.mockResolvedValue(undefined);
    mocks.syncFromRemote.mockResolvedValue({ total: 2, success: 2, failed: 0 });
    mocks.dataSyncOnUnmount.mockResolvedValue(undefined);
    mocks.removeOrphaned.mockResolvedValue(0);
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

    expect(useSyncStore.getState().isSynchronizing).toBe(true);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(mocks.dataSync).toHaveBeenCalledWith('u1');
    expect(mocks.syncFromRemote).toHaveBeenCalled();
    expect(mocks.showToast).toHaveBeenCalledWith('Sync success', 'success');
    expect(mocks.removeOrphaned).toHaveBeenCalled();
    expect(useSyncStore.getState().isSynchronized).toBe(true);
    expect(useSyncStore.getState().isSynchronizing).toBe(false);
    expect(useSyncStore.getState().isSyncError).toBe(false);

    unmount();
  });

  it('shows error toast and logs when sync fails', async () => {
    mocks.dataSync.mockRejectedValue(new Error('sync error'));

    const { unmount } = renderHook(() => usePeriodicSync('u1'));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(mocks.showToast).toHaveBeenCalledWith('Sync error', 'error');
    expect(mocks.reportError).toHaveBeenCalledWith(
      'Data synchronization failed',
      expect.any(Error),
    );
    expect(useSyncStore.getState().isSynchronized).toBe(false);
    expect(useSyncStore.getState().isSynchronizing).toBe(false);
    expect(useSyncStore.getState().isSyncError).toBe(true);

    unmount();
  });

  it('syncs user data on unmount', async () => {
    const { unmount } = renderHook(() => usePeriodicSync('u1'));

    unmount();

    expect(mocks.dataSyncOnUnmount).toHaveBeenCalledWith('u1');
    expect(useSyncStore.getState().isSynchronized).toBe(false);
    expect(useSyncStore.getState().isSynchronizing).toBe(false);
    expect(useSyncStore.getState().isSyncError).toBe(false);
  });
});
