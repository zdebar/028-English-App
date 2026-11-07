import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSyncStore } from '@/features/synchronization/use-sync-store';
import {
  SyncManager,
  isRetryableSyncError,
  syncManager,
} from '@/features/synchronization/sync-manager';

const mocks = vi.hoisted(() => ({
  syncDataTables: vi.fn(),
  dataSyncBeforeSessionEnd: vi.fn(),
  syncFromRemote: vi.fn(),
  removeOrphaned: vi.fn(),
  showToast: vi.fn(),
  reportError: vi.fn(),
  reportInfo: vi.fn(),
}));

vi.mock('@/config/config', () => ({
  default: {
    sync: {
      periodicSyncInterval: 60 * 60_000,
    },
  },
}));

vi.mock('@/database/sync/data-sync', () => ({
  DATA_SYNC_TABLES: ['Groups', 'GroupItems', 'GroupRelations', 'Levels', 'Lessons', 'Notes', 'UserItems', 'UserLessons'],
  syncDataTables: (...args: unknown[]) => mocks.syncDataTables(...args),
  dataSyncBeforeSessionEnd: (...args: unknown[]) => mocks.dataSyncBeforeSessionEnd(...args),
}));

vi.mock('@/database/models/audio-records', () => ({
  default: {
    syncFromRemote: (...args: unknown[]) => mocks.syncFromRemote(...args),
    removeOrphaned: (...args: unknown[]) => mocks.removeOrphaned(...args),
  },
}));

vi.mock('@/features/toast/use-toast-store', () => {
  const store = Object.assign(
    (selector: (state: { showToast: typeof mocks.showToast }) => unknown) =>
      selector({ showToast: mocks.showToast }),
    { getState: () => ({ showToast: mocks.showToast }) },
  );
  return { useToastStore: store };
});

vi.mock('@/features/logging/logging-handler', () => ({
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

const syncTables = ['Groups', 'GroupItems', 'GroupRelations', 'Levels', 'Lessons', 'Notes', 'UserItems', 'UserLessons'];
const isolatedManagers: SyncManager[] = [];

describe('usePeriodicSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    useSyncStore.setState({
      isSynchronized: false,
      isSynchronizing: false,
      isSyncError: false,
    });

    mocks.syncDataTables.mockImplementation(async (_userId: string, selectedTables = syncTables) =>
      selectedTables.map((table: string) => ({
        table,
        result: { status: 'fulfilled', value: { count: 0, changes: {} } },
      })),
    );
    mocks.syncFromRemote.mockResolvedValue({ total: 2, success: 2, failed: 0, failedArchives: [] });
    mocks.dataSyncBeforeSessionEnd.mockResolvedValue(undefined);
    mocks.removeOrphaned.mockResolvedValue(0);
  });

  afterEach(() => {
    syncManager.stop();
    for (const manager of isolatedManagers) manager.stop();
    isolatedManagers.length = 0;
    try {
      vi.runOnlyPendingTimers();
    } catch {
      // Ignore pending timer errors during teardown
    }
    vi.useRealTimers();
  });

  it('retries transient server and network errors but not permanent client or auth errors', () => {
    expect(isRetryableSyncError({ status: 429 })).toBe(true);
    expect(isRetryableSyncError({ statusCode: '503' })).toBe(true);
    expect(isRetryableSyncError(new TypeError('Failed to fetch'))).toBe(true);
    expect(isRetryableSyncError({ code: 'PGRST303', status: 500 })).toBe(false);
    expect(isRetryableSyncError({ status: 401 })).toBe(false);
    expect(isRetryableSyncError({ status: 403 })).toBe(false);
    expect(isRetryableSyncError({ status: 400, message: 'Network request failed' })).toBe(false);
    expect(isRetryableSyncError({
      message: 'Network request failed',
      cause: { status: 400 },
    })).toBe(false);
  });

  it('cancels a long Retry-After wait when the active account changes', async () => {
    const rateLimitError = { status: 429, retryAfterMs: 60_000 };
    const manager = new SyncManager();
    isolatedManagers.push(manager);
    mocks.syncDataTables.mockImplementation(async (userId: string, selectedTables = syncTables) =>
      selectedTables.map((table: string) => ({
        table,
        result: userId === 'u1' && table === 'Notes'
          ? { status: 'rejected', reason: rateLimitError }
          : { status: 'fulfilled', value: { count: 0, changes: {} } },
      })),
    );

    manager.start('u1');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(mocks.syncDataTables).toHaveBeenCalledTimes(1);

    manager.start('u2');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(mocks.syncDataTables.mock.calls.map(([userId]) => userId)).toEqual(['u1', 'u2']);
  });

  it('runs deferred sync and shows success toast when sync succeeds', async () => {
    const { unmount } = renderHook(() => usePeriodicSync('u1'));

    expect(useSyncStore.getState().isSynchronizing).toBe(true);
    expect(mocks.syncDataTables).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(mocks.syncDataTables).toHaveBeenCalledWith('u1', syncTables);
    expect(mocks.syncFromRemote).toHaveBeenCalledOnce();
    expect(mocks.showToast).toHaveBeenCalledWith('Sync success', 'success');
    expect(mocks.removeOrphaned).toHaveBeenCalled();
    expect(useSyncStore.getState().isSynchronized).toBe(true);
    expect(useSyncStore.getState().isSynchronizing).toBe(false);
    expect(useSyncStore.getState().isSyncError).toBe(false);

    unmount();
  });

  it('shows error toast and logs when sync fails', async () => {
    const syncError = new TypeError('Failed to fetch');
    mocks.syncDataTables.mockImplementation(async (_userId: string, selectedTables = syncTables) =>
      selectedTables.map((table: string) => ({
        table,
        result: table === 'Notes'
          ? { status: 'rejected', reason: syncError }
          : { status: 'fulfilled', value: { count: 0, changes: {} } },
      })),
    );

    const { unmount } = renderHook(() => usePeriodicSync('u1'));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(7000);
    });

    expect(mocks.showToast).toHaveBeenCalledWith('Sync error', 'error');
    expect(mocks.reportError).toHaveBeenCalledWith(
      'Synchronization task failed: Notes',
      syncError,
    );
    expect(mocks.syncDataTables).toHaveBeenCalledTimes(3);
    expect(mocks.syncDataTables.mock.calls.slice(1).map((call) => call[1])).toEqual([
      ['Notes'],
      ['Notes'],
    ]);
    expect(useSyncStore.getState().isSynchronized).toBe(false);
    expect(useSyncStore.getState().isSynchronizing).toBe(false);
    expect(useSyncStore.getState().isSyncError).toBe(true);

    unmount();
  });

  it('retries only a failed audio archive and clears the error after recovery', async () => {
    const error = new TypeError('Failed to fetch archive');
    mocks.syncFromRemote.mockImplementation(async () => {
      if (mocks.syncFromRemote.mock.calls.length > 3) {
        return { total: 1, success: 1, failed: 0, failedArchives: [] };
      }
      return {
        total: 2,
        success: 1,
        failed: 1,
        sampleErrors: [error],
        errors: [error],
        failedArchives: [{ archiveName: 'pack.zip', error }],
      };
    });

    const { unmount } = renderHook(() => usePeriodicSync('u1'));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(7000);
    });
    expect(mocks.syncFromRemote.mock.calls.map((call) => call[0])).toEqual([
      undefined,
      ['pack.zip'],
      ['pack.zip'],
    ]);
    expect(mocks.reportError).toHaveBeenCalledWith('Synchronization task failed: audio-archive:pack.zip', error);
    expect(useSyncStore.getState().isSynchronized).toBe(false);
    expect(useSyncStore.getState().isSyncError).toBe(true);
    expect(useSyncStore.getState().failedTasks).toEqual(['audio-archive:pack.zip']);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(mocks.syncFromRemote).toHaveBeenLastCalledWith(['pack.zip']);
    expect(useSyncStore.getState().isSynchronized).toBe(true);
    expect(useSyncStore.getState().isSyncError).toBe(false);

    unmount();
  });

  it('syncs user data on unmount', async () => {
    const { unmount } = renderHook(() => usePeriodicSync('u1'));

    unmount();

    expect(mocks.dataSyncBeforeSessionEnd).toHaveBeenCalledWith('u1');
    expect(useSyncStore.getState().isSynchronized).toBe(false);
    expect(useSyncStore.getState().isSynchronizing).toBe(false);
    expect(useSyncStore.getState().isSyncError).toBe(false);
  });
});
