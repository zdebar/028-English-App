import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useLocalStorageSync } from '../user-local-storage-sync';

describe('useLocalStorageSync', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('loads saved value on mount when different from current value', () => {
    localStorage.setItem('term', 'saved-value');
    const setter = vi.fn();

    renderHook(() => useLocalStorageSync('term', 'current-value', setter));

    expect(setter).toHaveBeenCalledWith('saved-value');
  });

  it('does not call setter when no saved value exists or saved equals current', () => {
    const setter = vi.fn();

    renderHook(() => useLocalStorageSync('term', 'same-value', setter));
    expect(setter).not.toHaveBeenCalled();

    localStorage.setItem('term', 'same-value');
    renderHook(() => useLocalStorageSync('term', 'same-value', setter));
    expect(setter).not.toHaveBeenCalled();
  });

  it('saves current value to localStorage on mount and when dependencies change', () => {
    const setter = vi.fn();
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    const { rerender } = renderHook(
      ({ key, value }) => useLocalStorageSync(key, value, setter),
      {
        initialProps: { key: 'term', value: 'first' },
      },
    );

    expect(localStorage.getItem('term')).toBe('first');

    rerender({ key: 'term', value: 'second' });
    expect(localStorage.getItem('term')).toBe('second');

    rerender({ key: 'term-2', value: 'another' });
    expect(localStorage.getItem('term-2')).toBe('another');

    expect(setItemSpy).toHaveBeenCalled();
  });
});