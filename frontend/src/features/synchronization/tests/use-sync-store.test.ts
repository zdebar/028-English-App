import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSyncStore } from '@/features/synchronization/use-sync-store';

describe('useSyncStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSyncStore.setState({
      isSynchronized: false,
      isSynchronizing: false,
      isSyncError: false,
      syncRevision: 0,
    });
  });

  it('starts unsynchronized and without sync error', () => {
    expect(useSyncStore.getState().isSynchronized).toBe(false);
    expect(useSyncStore.getState().isSynchronizing).toBe(false);
    expect(useSyncStore.getState().isSyncError).toBe(false);
    expect(useSyncStore.getState().syncRevision).toBe(0);
  });

  it('tracks synchronization and error state independently', () => {
    useSyncStore.getState().setSynchronizing(true);
    useSyncStore.getState().setSyncError(true);
    useSyncStore.getState().setSynchronized(true);

    expect(useSyncStore.getState().isSynchronizing).toBe(true);
    expect(useSyncStore.getState().isSyncError).toBe(true);
    expect(useSyncStore.getState().isSynchronized).toBe(true);
    expect(useSyncStore.getState().syncRevision).toBe(1);
  });

  it('increments sync revision for each successful synchronization', () => {
    useSyncStore.getState().setSynchronized(true);
    useSyncStore.getState().setSynchronized(true);
    useSyncStore.getState().setSynchronized(false);

    expect(useSyncStore.getState().syncRevision).toBe(2);
  });

  it('resetSyncState clears all sync flags', () => {
    useSyncStore.getState().setSynchronizing(true);
    useSyncStore.getState().setSyncError(true);
    useSyncStore.getState().setSynchronized(true);

    useSyncStore.getState().resetSyncState();

    expect(useSyncStore.getState().isSynchronized).toBe(false);
    expect(useSyncStore.getState().isSynchronizing).toBe(false);
    expect(useSyncStore.getState().isSyncError).toBe(false);
    expect(useSyncStore.getState().syncRevision).toBe(0);
  });
});
