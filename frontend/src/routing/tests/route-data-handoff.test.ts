import {
  ROUTE_DATA_HANDOFF_TTL_MS,
  consumePreparedRouteData,
  invalidateRouteData,
  prepareRouteData,
  resetPreparedRouteData,
} from '@/routing/route-data-handoff';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('route data handoff', () => {
  afterEach(() => {
    resetPreparedRouteData();
    vi.useRealTimers();
  });

  it('deduplicates concurrent preparation and hands the result to one loader', async () => {
    const load = vi.fn().mockResolvedValue(['data']);
    const descriptor = { key: 'topics:user-1', load };

    const first = prepareRouteData(descriptor);
    const second = prepareRouteData(descriptor);

    expect(first).toBe(second);
    await expect(consumePreparedRouteData(descriptor)).resolves.toEqual(['data']);
    expect(load).toHaveBeenCalledTimes(1);

    await expect(consumePreparedRouteData(descriptor)).resolves.toEqual(['data']);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('isolates user and parameter keys', async () => {
    const firstLoad = vi.fn().mockResolvedValue('first');
    const secondLoad = vi.fn().mockResolvedValue('second');
    await Promise.all([
      prepareRouteData({ key: 'topic:user-1:4', load: firstLoad }),
      prepareRouteData({ key: 'topic:user-2:4', load: secondLoad }),
    ]);
    expect(firstLoad).toHaveBeenCalledOnce();
    expect(secondLoad).toHaveBeenCalledOnce();
  });

  it('expires successful unconsumed data after ten seconds', async () => {
    vi.useFakeTimers();
    const load = vi.fn().mockResolvedValue('data');
    const descriptor = { key: 'levels:user-1', load };
    await prepareRouteData(descriptor);

    await vi.advanceTimersByTimeAsync(ROUTE_DATA_HANDOFF_TTL_MS);
    await consumePreparedRouteData(descriptor);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('evicts failures immediately so a click can retry', async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue('ok');
    const descriptor = { key: 'grammar:user-1', load };

    await expect(prepareRouteData(descriptor)).rejects.toThrow('offline');
    await expect(prepareRouteData(descriptor)).resolves.toBe('ok');
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('invalidates matching route/user prefixes only', async () => {
    const topicLoad = vi.fn().mockResolvedValue('topic');
    const levelLoad = vi.fn().mockResolvedValue('level');
    const topic = { key: 'topic:user-1:2', load: topicLoad };
    const level = { key: 'levels:user-1', load: levelLoad };
    await Promise.all([prepareRouteData(topic), prepareRouteData(level)]);

    invalidateRouteData('topic:user-1');
    await Promise.all([consumePreparedRouteData(topic), consumePreparedRouteData(level)]);
    expect(topicLoad).toHaveBeenCalledTimes(2);
    expect(levelLoad).toHaveBeenCalledTimes(1);
  });
});
