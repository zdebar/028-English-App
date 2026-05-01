import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSyncWarningStore } from '@/features/sync/use-sync-warning';

describe('useSyncWarningStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.localStorage.removeItem('sync-warning');
    useSyncWarningStore.setState({ isSynchronized: true });
  });

  it('starts synchronized by default', () => {
    expect(useSyncWarningStore.getState().isSynchronized).toBe(true);
  });

  it('setSynchronized updates in-memory state', () => {
    useSyncWarningStore.getState().setSynchronized(false);

    expect(useSyncWarningStore.getState().isSynchronized).toBe(false);
  });

  it('setSynchronized persists state to localStorage', () => {
    useSyncWarningStore.getState().setSynchronized(false);

    const raw = globalThis.localStorage.getItem('sync-warning');
    expect(raw).toBeTruthy();

    const parsed = JSON.parse(raw as string) as {
      state: { isSynchronized: boolean };
      version: number;
    };

    expect(parsed.state.isSynchronized).toBe(false);
  });
});
