import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Observer = {
  next: (value: any) => void;
  error: (error: unknown) => void;
};

const mocks = vi.hoisted(() => ({
  observers: [] as Observer[],
  queries: [] as Array<() => Promise<unknown>>,
  unsubscribes: [] as ReturnType<typeof vi.fn>[],
  getOverview: vi.fn(),
  reportError: vi.fn(),
  currentDate: '2026-04-15',
}));

vi.mock('@/config/config', () => ({
  default: { sync: { scoreResetCheckInterval: 1000 } },
}));

vi.mock('@/database/models/levels', () => ({
  default: { getOverview: (...args: unknown[]) => mocks.getOverview(...args) },
}));

vi.mock('@/features/logging/monitoring-handler', () => ({
  reportError: (...args: unknown[]) => mocks.reportError(...args),
}));

vi.mock('dexie', () => ({
  liveQuery: (query: () => Promise<unknown>) => ({
    subscribe: (observer: Observer) => {
      const unsubscribe = vi.fn();
      mocks.queries.push(query);
      mocks.observers.push(observer);
      mocks.unsubscribes.push(unsubscribe);
      return { unsubscribe };
    },
  }),
}));

import { useUserStore } from '@/features/user-stats/use-user-store';
import { useUserStoreSync } from '@/features/user-stats/use-user-store-sync';

describe('useUserStoreSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mocks.observers.length = 0;
    mocks.queries.length = 0;
    mocks.unsubscribes.length = 0;
    mocks.currentDate = '2026-04-15';
    vi.spyOn(Date.prototype, 'toLocaleDateString').mockImplementation(() => mocks.currentDate);
    useUserStore.setState({ levels: [], startedTodayCount: 0 });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('subscribes for the active user and stores emitted snapshots', async () => {
    renderHook(() => useUserStoreSync('u1'));

    expect(mocks.queries).toHaveLength(1);
    await mocks.queries[0]();
    expect(mocks.getOverview).toHaveBeenCalledWith('u1', '2026-04-15');

    act(() => {
      mocks.observers[0].next([{ id: 1, startedTodayCount: 7 }]);
    });

    expect(useUserStore.getState()).toMatchObject({
      levels: [{ id: 1 }],
      levelsLoading: false,
      startedTodayCount: 7,
    });
  });

  it('recreates the subscription when the local date changes', () => {
    renderHook(() => useUserStoreSync('u1'));
    mocks.currentDate = '2026-04-16';

    act(() => vi.advanceTimersByTime(1000));

    expect(mocks.queries).toHaveLength(2);
    expect(mocks.unsubscribes[0]).toHaveBeenCalledOnce();
  });

  it('unsubscribes and clears snapshots on sign-out', () => {
    const { rerender } = renderHook(({ userId }) => useUserStoreSync(userId), {
      initialProps: { userId: 'u1' as string | null },
    });
    act(() => {
      mocks.observers[0].next([{ id: 1, startedTodayCount: 4 }]);
    });

    rerender({ userId: null });

    expect(mocks.unsubscribes[0]).toHaveBeenCalledOnce();
    expect(useUserStore.getState()).toMatchObject({ levels: [], startedTodayCount: 0 });
  });

  it('clears stale snapshots and ignores the previous user after an account switch', () => {
    const { rerender } = renderHook(({ userId }) => useUserStoreSync(userId), {
      initialProps: { userId: 'u1' },
    });
    act(() => {
      mocks.observers[0].next([{ id: 1, startedTodayCount: 4 }]);
    });

    rerender({ userId: 'u2' });
    expect(useUserStore.getState()).toMatchObject({
      levels: [],
      levelsLoading: true,
      startedTodayCount: 0,
    });

    act(() => {
      mocks.observers[0].next([{ id: 99, startedTodayCount: 99 }]);
      mocks.observers[1].next([{ id: 2, startedTodayCount: 8 }]);
    });

    expect(useUserStore.getState()).toMatchObject({
      levels: [{ id: 2, startedTodayCount: 8 }],
      startedTodayCount: 8,
    });
  });

  it('records observer failures and ignores emissions after cleanup', () => {
    const { unmount } = renderHook(() => useUserStoreSync('u1'));
    const levelsError = new Error('levels failed');

    act(() => mocks.observers[0].error(levelsError));
    expect(useUserStore.getState().levelsError).toBe(levelsError);
    expect(mocks.reportError).toHaveBeenCalledWith('Error observing levels', levelsError);

    unmount();
    act(() => mocks.observers[0].next([{ id: 99, startedTodayCount: 99 }]));
    expect(useUserStore.getState().startedTodayCount).toBe(0);
  });
});
