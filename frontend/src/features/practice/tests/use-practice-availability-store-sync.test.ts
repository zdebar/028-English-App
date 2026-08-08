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
  getReadyPracticeState: vi.fn(),
  getPronunciationPracticeCount: vi.fn(),
  reportError: vi.fn(),
}));

vi.mock('@/config/config', () => ({
  default: { practice: { maxReadyScheduleTimerDelayMs: 60_000 } },
}));
vi.mock('@/database/models/db', () => ({
  db: {
    user_items: {},
    user_blocks: {},
    transaction: async (...args: unknown[]) => {
      const callback = args.at(-1) as () => Promise<unknown>;
      return callback();
    },
  },
}));
vi.mock('@/database/models/user-items', () => ({
  default: {
    getReadyPracticeState: (...args: unknown[]) => mocks.getReadyPracticeState(...args),
    getPronunciationPracticeCount: (...args: unknown[]) =>
      mocks.getPronunciationPracticeCount(...args),
  },
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

import { usePracticeAvailabilityStore } from '../use-practice-availability-store';
import { usePracticeAvailabilityStoreSync } from '../use-practice-availability-store-sync';

describe('usePracticeAvailabilityStoreSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-21T10:00:00.000Z'));
    mocks.observers.length = 0;
    mocks.queries.length = 0;
    mocks.unsubscribes.length = 0;
    usePracticeAvailabilityStore.getState().reset();
  });

  afterEach(() => vi.useRealTimers());

  it('subscribes once per availability source and stores emitted snapshots', async () => {
    renderHook(() => usePracticeAvailabilityStoreSync('u1'));

    expect(mocks.queries).toHaveLength(2);
    await mocks.queries[0]();
    await mocks.queries[1]();
    expect(mocks.getReadyPracticeState).toHaveBeenCalledWith('u1');
    expect(mocks.getPronunciationPracticeCount).toHaveBeenCalledWith('u1');

    act(() => {
      mocks.observers[0].next({ readyCount: 3, schedule: [] });
      mocks.observers[1].next(2);
    });
    expect(usePracticeAvailabilityStore.getState()).toMatchObject({
      readyCount: 3,
      readyLoading: false,
      pronunciationCount: 2,
      pronunciationLoading: false,
    });
  });

  it('moves consecutive scheduled groups into a non-empty ready count without remounting Home', () => {
    renderHook(() => usePracticeAvailabilityStoreSync('u1'));
    act(() => {
      mocks.observers[0].next({
        readyCount: 1,
        schedule: [
          { date: '2026-07-21T10:00:01.000Z', count: 1 },
          { date: '2026-07-21T10:00:02.000Z', count: 1 },
        ],
      });
    });

    act(() => vi.advanceTimersByTime(1000));
    expect(usePracticeAvailabilityStore.getState()).toMatchObject({
      readyCount: 2,
      readySchedule: [{ date: '2026-07-21T10:00:02.000Z', count: 1 }],
    });

    act(() => vi.advanceTimersByTime(1000));
    expect(usePracticeAvailabilityStore.getState()).toMatchObject({
      readyCount: 3,
      readySchedule: [],
    });
  });

  it('clears stale snapshots and subscriptions when the user changes', () => {
    const { rerender } = renderHook(({ userId }) => usePracticeAvailabilityStoreSync(userId), {
      initialProps: { userId: 'u1' as string | null },
    });
    act(() => {
      mocks.observers[0].next({ readyCount: 3, schedule: [] });
      mocks.observers[1].next(2);
    });

    rerender({ userId: 'u2' });
    expect(mocks.unsubscribes[0]).toHaveBeenCalledOnce();
    expect(mocks.unsubscribes[1]).toHaveBeenCalledOnce();
    expect(usePracticeAvailabilityStore.getState()).toMatchObject({
      readyCount: 0,
      readyLoading: true,
      pronunciationCount: 0,
      pronunciationLoading: true,
    });

    act(() => mocks.observers[0].next({ readyCount: 99, schedule: [] }));
    expect(usePracticeAvailabilityStore.getState().readyCount).toBe(0);
  });

  it('clears snapshots on sign-out and ignores emissions after unmount', () => {
    const { rerender, unmount } = renderHook(
      ({ userId }) => usePracticeAvailabilityStoreSync(userId),
      { initialProps: { userId: 'u1' as string | null } },
    );
    act(() => {
      mocks.observers[0].next({ readyCount: 3, schedule: [] });
      mocks.observers[1].next(2);
    });

    rerender({ userId: null });
    expect(usePracticeAvailabilityStore.getState()).toMatchObject({
      readyCount: 0,
      readyLoading: false,
      pronunciationCount: 0,
      pronunciationLoading: false,
    });

    unmount();
    act(() => mocks.observers[0].next({ readyCount: 99, schedule: [] }));
    expect(usePracticeAvailabilityStore.getState().readyCount).toBe(0);
  });

  it('stores and reports both observer failures', () => {
    renderHook(() => usePracticeAvailabilityStoreSync('u1'));
    const readyError = new Error('ready failed');
    const pronunciationError = new Error('pronunciation failed');

    act(() => {
      mocks.observers[0].error(readyError);
      mocks.observers[1].error(pronunciationError);
    });

    expect(usePracticeAvailabilityStore.getState()).toMatchObject({
      readyLoading: false,
      readyError,
      pronunciationLoading: false,
      pronunciationError,
    });
    expect(mocks.reportError).toHaveBeenCalledTimes(2);
  });
});
