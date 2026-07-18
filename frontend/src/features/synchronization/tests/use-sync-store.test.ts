import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSyncStore } from '@/features/synchronization/use-sync-store';

describe('useSyncStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSyncStore.setState({
      isSynchronized: false,
      isSynchronizing: false,
      isSyncError: false,
    });
  });

  it('starts unsynchronized and without sync error', () => {
    expect(useSyncStore.getState().isSynchronized).toBe(false);
    expect(useSyncStore.getState().isSynchronizing).toBe(false);
    expect(useSyncStore.getState().isSyncError).toBe(false);
  });

  it('tracks synchronization and error state independently', () => {
    useSyncStore.getState().setSynchronizing(true);
    useSyncStore.getState().setSyncError(true);
    useSyncStore.getState().setSynchronized(true);

    expect(useSyncStore.getState().isSynchronizing).toBe(true);
    expect(useSyncStore.getState().isSyncError).toBe(true);
    expect(useSyncStore.getState().isSynchronized).toBe(true);
  });

  it('resetSyncState clears all sync flags', () => {
    useSyncStore.getState().setSynchronizing(true);
    useSyncStore.getState().setSyncError(true);
    useSyncStore.getState().setSynchronized(true);

    useSyncStore.getState().resetSyncState();

    expect(useSyncStore.getState().isSynchronized).toBe(false);
    expect(useSyncStore.getState().isSynchronizing).toBe(false);
    expect(useSyncStore.getState().isSyncError).toBe(false);
  });
});
