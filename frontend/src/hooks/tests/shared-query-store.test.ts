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

  it('shares one 5,000-item query between concurrent loaders, mount and remount', async () => {
    const items = Array.from({ length: 5000 }, (_, id) => ({ id }));
    const query = vi.fn(async () => items);
    const [initialData] = await Promise.all([
      loadSharedQuery('u1', 'items', query),
      loadSharedQuery('u1', 'items', query),
    ]);
    const options = { emptyData: [], initialData, sharedKey: sharedQueryKey('u1', 'items') };
    const page = renderHook(() => useLiveQueryData(query, options));
    expect(page.result.current.data).toBe(items);
    page.unmount();
    renderHook(() => useLiveQueryData(query, options));
    await loadSharedQuery('u1', 'items', query);
    expect(query).toHaveBeenCalledOnce();
    expect(observers).toHaveLength(1);
    expect(observers[0].unsubscribe).not.toHaveBeenCalled();
  });

  it('publishes changed data to mounted pages and later loaders', async () => {
    const query = vi.fn(async () => ['initial']);
    await loadSharedQuery('u1', 'items', query);
    const { result } = renderHook(() => useLiveQueryData(query, {
      emptyData: [], sharedKey: sharedQueryKey('u1', 'items'),
    }));
    act(() => observers[0].next(['updated']));
    expect(result.current.data).toEqual(['updated']);
    await expect(loadSharedQuery('u1', 'items', query)).resolves.toEqual(['updated']);
    expect(query).toHaveBeenCalledOnce();
  });

  it('disposes the old account and prevents reuse across accounts', async () => {
    const query = vi.fn(async () => ['private']);
    await loadSharedQuery('u1', 'items', query);
    clearSharedQueriesExcept('u2');
    expect(observers[0].unsubscribe).toHaveBeenCalledOnce();
    await expect(loadSharedQuery('u2', 'items', async () => ['other'])).resolves.toEqual(['other']);
    await loadSharedQuery('u1', 'items', query);
    expect(query).toHaveBeenCalledTimes(2);
  });

  it('retries a failed query on the next load', async () => {
    const query = vi.fn().mockRejectedValueOnce(new Error('failed')).mockResolvedValue(['recovered']);
    await expect(loadSharedQuery('u1', 'items', query)).rejects.toThrow('failed');
    await expect(loadSharedQuery('u1', 'items', query)).resolves.toEqual(['recovered']);
    expect(query).toHaveBeenCalledTimes(2);
  });

  it('settles pending loaders when their account is cleared', async () => {
    const loading = loadSharedQuery('u1', 'items', () => new Promise<string[]>(() => {}));
    const result = expect(loading).rejects.toThrow('Query account changed');
    clearSharedQueriesExcept(null);
    await result;
    await waitFor(() => expect(observers[0].unsubscribe).toHaveBeenCalledOnce());
  });
});
