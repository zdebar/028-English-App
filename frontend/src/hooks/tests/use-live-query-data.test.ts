import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type Observer<T> = {
  next: (value: T) => void;
  error: (error: unknown) => void;
  unsubscribe: ReturnType<typeof vi.fn>;
};

const mocks = vi.hoisted(() => ({
  observers: [] as Observer<unknown>[],
}));

vi.mock('dexie', () => ({
  liveQuery: () => ({
    subscribe: (observer: Omit<Observer<unknown>, 'unsubscribe'>) => {
      const unsubscribe = vi.fn();
      mocks.observers.push({ ...observer, unsubscribe });
      return { unsubscribe };
    },
  }),
}));

import { useLiveQueryData } from '../use-live-query-data';

describe('useLiveQueryData', () => {
  beforeEach(() => {
    mocks.observers = [];
  });

  it('renders loader data immediately and replaces it after a live emission', () => {
    const query = vi.fn(async () => ['database']);
    const initialData = ['loader'];
    const { result } = renderHook(() =>
      useLiveQueryData(query, { emptyData: [], initialData }),
    );

    expect(result.current).toEqual({ data: ['loader'], loading: false, error: null });

    act(() => mocks.observers[0].next(['synchronized']));

    expect(result.current).toEqual({ data: ['synchronized'], loading: false, error: null });
  });

  it('keeps the last successful data on errors and unsubscribes on query changes', () => {
    const firstQuery = vi.fn(async () => ['first']);
    const secondQuery = vi.fn(async () => ['second']);
    const { result, rerender, unmount } = renderHook(
      ({ query }) => useLiveQueryData(query, { emptyData: [] as string[] }),
      { initialProps: { query: firstQuery } },
    );

    act(() => mocks.observers[0].next(['current']));
    act(() => mocks.observers[0].error(new Error('live query failed')));

    expect(result.current.data).toEqual(['current']);
    expect(result.current.error?.message).toBe('live query failed');

    rerender({ query: secondQuery });
    expect(mocks.observers[0].unsubscribe).toHaveBeenCalledTimes(1);

    unmount();
    expect(mocks.observers[1].unsubscribe).toHaveBeenCalledTimes(1);
  });
});
