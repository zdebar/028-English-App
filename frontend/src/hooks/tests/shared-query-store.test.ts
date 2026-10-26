import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const observers = vi.hoisted(() => [] as Array<{
  next: (data: unknown) => void;
  error: (error: unknown) => void;
  unsubscribe: ReturnType<typeof vi.fn>;
}>);
vi.mock('dexie', () => ({
  liveQuery: (query: () => Promise<unknown>) => ({
    subscribe: (observer: Omit<typeof observers[number], 'unsubscribe'>) => {
      const unsubscribe = vi.fn();
      observers.push({ ...observer, unsubscribe });
      void query().then(observer.next, observer.error);
      return { unsubscribe };
    },
  }),
}));

import { clearSharedQueriesExcept, loadSharedQuery, sharedQueryKey } from '../shared-query-store';
import { useLiveQueryData } from '../use-live-query-data';

describe('shared route query store', () => {
  beforeEach(() => {
    clearSharedQueriesExcept(null);
    observers.length = 0;
  });

  it('shares one live query between mounted consumers and releases it after the last unmount', async () => {
    const items = Array.from({ length: 5000 }, (_, id) => ({ id }));
    const query = vi.fn(async () => items);
    const options = { emptyData: [], sharedKey: sharedQueryKey('u1', 'items') };
    const firstPage = renderHook(() => useLiveQueryData(query, options));
    const secondPage = renderHook(() => useLiveQueryData(query, options));

    await waitFor(() => expect(firstPage.result.current.data).toBe(items));
    expect(query).toHaveBeenCalledOnce();
    expect(observers).toHaveLength(1);
    firstPage.unmount();
    expect(observers[0].unsubscribe).not.toHaveBeenCalled();
    secondPage.unmount();
    expect(observers[0].unsubscribe).toHaveBeenCalledOnce();
  });

  it('publishes observed changes while keeping route loads one-shot', async () => {
    let currentData = ['initial'];
    const query = vi.fn(async () => currentData);
    const { result } = renderHook(() => useLiveQueryData(query, {
      emptyData: [], sharedKey: sharedQueryKey('u1', 'items'),
    }));
    await waitFor(() => expect(result.current.data).toEqual(['initial']));
    act(() => observers[0].next(['updated']));
    expect(result.current.data).toEqual(['updated']);
    currentData = ['fresh route data'];
    await expect(loadSharedQuery('u1', 'items', query)).resolves.toEqual(currentData);
    expect(query).toHaveBeenCalledTimes(2);
  });

  it('disposes live queries when their account is cleared', async () => {
    const query = vi.fn(async () => ['private']);
    const page = renderHook(() => useLiveQueryData(query, {
      emptyData: [], sharedKey: sharedQueryKey('u1', 'items'),
    }));
    await waitFor(() => expect(observers).toHaveLength(1));

    act(() => clearSharedQueriesExcept('u2'));
    expect(observers[0].unsubscribe).toHaveBeenCalledOnce();
    await waitFor(() =>
      expect(page.result.current.error?.message).toBe('Query account changed'),
    );
    page.unmount();
  });

  it('retries a failed live query when it is observed again', async () => {
    const query = vi.fn().mockRejectedValueOnce(new Error('failed')).mockResolvedValue(['recovered']);
    const options = { emptyData: [], sharedKey: sharedQueryKey('u1', 'items') };
    const firstPage = renderHook(() => useLiveQueryData(query, options));
    await waitFor(() => expect(firstPage.result.current.error?.message).toBe('failed'));
    firstPage.unmount();

    const secondPage = renderHook(() => useLiveQueryData(query, options));
    await waitFor(() => expect(secondPage.result.current.data).toEqual(['recovered']));
    expect(query).toHaveBeenCalledTimes(2);
    secondPage.unmount();
  });

  it('does not create a live observer for one-shot route loads', async () => {
    const query = vi.fn(async () => ['route data']);

    await expect(loadSharedQuery('u1', 'items', query)).resolves.toEqual(['route data']);

    expect(query).toHaveBeenCalledOnce();
    expect(observers).toHaveLength(0);
  });
});
