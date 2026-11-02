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

import { clearSharedQueriesExcept, sharedQueryKey } from '../queries/shared-query-store';
import { useLiveQueryData } from '@/hooks/use-live-query-data';

describe('shared live query store', () => {
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

  it('publishes observed changes to current consumers', async () => {
    const query = vi.fn(async () => ['initial']);
    const { result } = renderHook(() => useLiveQueryData(query, {
      emptyData: [], sharedKey: sharedQueryKey('u1', 'items'),
    }));
    await waitFor(() => expect(result.current.data).toEqual(['initial']));
    act(() => observers[0].next(['updated']));
    expect(result.current.data).toEqual(['updated']);
    expect(query).toHaveBeenCalledOnce();
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

    const secondPage = renderHook(() => useLiveQueryData(query, options));
    await waitFor(() => expect(secondPage.result.current.data).toEqual(['recovered']));
    expect(query).toHaveBeenCalledTimes(2);
    expect(observers[0].unsubscribe).toHaveBeenCalledOnce();
    firstPage.unmount();
    secondPage.unmount();
  });
});
