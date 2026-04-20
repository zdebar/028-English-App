import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { clearAppStorage } from '@/features/auth/auth.utils';

async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe('clearAppStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('clears local and session storage, indexedDB databases, and caches', async () => {
    window.localStorage.setItem('k1', 'v1');
    window.sessionStorage.setItem('k2', 'v2');

    const databases = vi.fn().mockResolvedValue([{ name: 'db1' }, { name: 'db2' }]);
    const deleteDatabase = vi.fn();
    const cachesKeys = vi.fn().mockResolvedValue(['cache-a', 'cache-b']);
    const cachesDelete = vi.fn().mockResolvedValue(true);

    vi.stubGlobal('indexedDB', {
      databases,
      deleteDatabase,
    });

    vi.stubGlobal('caches', {
      keys: cachesKeys,
      delete: cachesDelete,
    });

    clearAppStorage();
    await flushMicrotasks();

    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.length).toBe(0);

    expect(databases).toHaveBeenCalledTimes(1);
    expect(deleteDatabase).toHaveBeenCalledWith('db1');
    expect(deleteDatabase).toHaveBeenCalledWith('db2');

    expect(cachesKeys).toHaveBeenCalledTimes(1);
    expect(cachesDelete).toHaveBeenCalledWith('cache-a');
    expect(cachesDelete).toHaveBeenCalledWith('cache-b');
  });

  it('does not throw when indexedDB databases API is unavailable', () => {
    window.localStorage.setItem('k1', 'v1');
    window.sessionStorage.setItem('k2', 'v2');

    vi.stubGlobal('indexedDB', {
      deleteDatabase: vi.fn(),
    });

    vi.stubGlobal('caches', {
      keys: vi.fn().mockResolvedValue([]),
      delete: vi.fn().mockResolvedValue(true),
    });

    expect(() => clearAppStorage()).not.toThrow();
    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.length).toBe(0);
  });
});
