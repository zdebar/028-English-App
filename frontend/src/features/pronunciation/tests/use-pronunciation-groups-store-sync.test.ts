import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type Observer = {
  next: (value: unknown[]) => void;
  error: (error: unknown) => void;
};

const mocks = vi.hoisted(() => ({
  observers: [] as Observer[],
  queries: [] as Array<() => Promise<unknown>>,
  unsubscribes: [] as ReturnType<typeof vi.fn>[],
  getOverview: vi.fn(),
  reportError: vi.fn(),
}));

vi.mock('@/database/models/pronunciation-groups', () => ({
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

import { usePronunciationGroupsStore } from '../use-pronunciation-groups-store';
import { usePronunciationGroupsStoreSync } from '../use-pronunciation-groups-store-sync';

describe('usePronunciationGroupsStoreSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.observers.length = 0;
    mocks.queries.length = 0;
    mocks.unsubscribes.length = 0;
    usePronunciationGroupsStore.setState({ groups: [], loading: false, error: null });
  });

  it('subscribes for the active user and stores emitted snapshots', async () => {
    renderHook(() => usePronunciationGroupsStoreSync('u1'));

    expect(usePronunciationGroupsStore.getState().loading).toBe(true);
    await mocks.queries[0]();
    expect(mocks.getOverview).toHaveBeenCalledWith('u1');

    act(() => mocks.observers[0].next([{ id: 1 }]));
    expect(usePronunciationGroupsStore.getState()).toMatchObject({
      groups: [{ id: 1 }],
      loading: false,
      error: null,
    });
  });

  it('replaces the subscription and clears stale data when the user changes', () => {
    const { rerender } = renderHook(({ userId }) => usePronunciationGroupsStoreSync(userId), {
      initialProps: { userId: 'u1' as string | null },
    });
    act(() => mocks.observers[0].next([{ id: 1 }]));

    rerender({ userId: 'u2' });
    expect(mocks.unsubscribes[0]).toHaveBeenCalledOnce();
    expect(usePronunciationGroupsStore.getState()).toMatchObject({ groups: [], loading: true });

    act(() => {
      mocks.observers[0].next([{ id: 99 }]);
      mocks.observers[1].next([{ id: 2 }]);
    });
    expect(usePronunciationGroupsStore.getState().groups).toEqual([{ id: 2 }]);
  });

  it('unsubscribes and clears the snapshot on sign-out', () => {
    const { rerender } = renderHook(({ userId }) => usePronunciationGroupsStoreSync(userId), {
      initialProps: { userId: 'u1' as string | null },
    });
    act(() => mocks.observers[0].next([{ id: 1 }]));

    rerender({ userId: null });

    expect(mocks.unsubscribes[0]).toHaveBeenCalledOnce();
    expect(usePronunciationGroupsStore.getState()).toMatchObject({
      groups: [],
      loading: false,
      error: null,
    });
  });

  it('stores and reports observer errors', () => {
    renderHook(() => usePronunciationGroupsStoreSync('u1'));
    const error = new Error('query failed');

    act(() => mocks.observers[0].error(error));

    expect(usePronunciationGroupsStore.getState()).toMatchObject({
      groups: [],
      loading: false,
      error,
    });
    expect(mocks.reportError).toHaveBeenCalledWith('Error observing pronunciation groups', error);
  });
});
