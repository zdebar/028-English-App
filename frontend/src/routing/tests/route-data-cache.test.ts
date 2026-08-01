import {
  ROUTE_PREFETCH_TTL_MS,
  consumeRouteData,
  invalidateRouteData,
  prefetchRouteData,
  resetRouteDataCache,
} from '@/routing/route-data-cache';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('route data cache', () => {
  afterEach(() => {
    resetRouteDataCache();
    vi.useRealTimers();
  });

  it('deduplicates concurrent prefetch and hands the result to one loader', async () => {
    const load = vi.fn().mockResolvedValue(['data']);
    const descriptor = { key: 'topics:user-1', load };

    const first = prefetchRouteData(descriptor);
    const second = prefetchRouteData(descriptor);

    expect(first).toBe(second);
    await expect(consumeRouteData(descriptor)).resolves.toEqual(['data']);
    expect(load).toHaveBeenCalledTimes(1);

    await expect(consumeRouteData(descriptor)).resolves.toEqual(['data']);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('isolates user and parameter keys', async () => {
    const firstLoad = vi.fn().mockResolvedValue('first');
    const secondLoad = vi.fn().mockResolvedValue('second');
    await Promise.all([
      prefetchRouteData({ key: 'topic:user-1:4', load: firstLoad }),
      prefetchRouteData({ key: 'topic:user-2:4', load: secondLoad }),
    ]);
    expect(firstLoad).toHaveBeenCalledOnce();
    expect(secondLoad).toHaveBeenCalledOnce();
  });

  it('expires successful unconsumed data after ten seconds', async () => {
    vi.useFakeTimers();
    const load = vi.fn().mockResolvedValue('data');
    const descriptor = { key: 'levels:user-1', load };
    await prefetchRouteData(descriptor);

    await vi.advanceTimersByTimeAsync(ROUTE_PREFETCH_TTL_MS);
    await consumeRouteData(descriptor);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('evicts failures immediately so a click can retry', async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue('ok');
    const descriptor = { key: 'grammar:user-1', load };

    await expect(prefetchRouteData(descriptor)).rejects.toThrow('offline');
    await expect(prefetchRouteData(descriptor)).resolves.toBe('ok');
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('invalidates matching route/user prefixes only', async () => {
    const topicLoad = vi.fn().mockResolvedValue('topic');
    const levelLoad = vi.fn().mockResolvedValue('level');
    const topic = { key: 'topic:user-1:2', load: topicLoad };
    const level = { key: 'levels:user-1', load: levelLoad };
    await Promise.all([prefetchRouteData(topic), prefetchRouteData(level)]);

    invalidateRouteData('topic:user-1');
    await Promise.all([consumeRouteData(topic), consumeRouteData(level)]);
    expect(topicLoad).toHaveBeenCalledTimes(2);
    expect(levelLoad).toHaveBeenCalledTimes(1);
  });
});
