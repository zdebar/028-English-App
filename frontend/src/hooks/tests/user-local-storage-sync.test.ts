import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useLocalStorageSync } from '../user-local-storage-sync';

describe('useLocalStorageSync', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('loads saved value on mount when different from current value', () => {
    // store as JSON because hook uses JSON.parse
    localStorage.setItem('term', JSON.stringify('saved-value'));

    const { result } = renderHook(() => useLocalStorageSync('term', 'current-value'));

    expect(result.current[0]).toBe('saved-value');
  });

  it('does not call setter when no saved value exists or saved equals current', () => {
    // No stored value -> hook returns initial value
    let { result } = renderHook(() => useLocalStorageSync('term', 'same-value'));
    expect(result.current[0]).toBe('same-value');

    // Stored value equals current -> hook returns stored (same) value
    localStorage.setItem('term', JSON.stringify('same-value'));
    result = renderHook(() => useLocalStorageSync('term', 'same-value')).result;
    expect(result.current[0]).toBe('same-value');
  });

  it('saves current value to localStorage on mount and when dependencies change', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    const { result, rerender } = renderHook(({ key, value }) => useLocalStorageSync(key, value), {
      initialProps: { key: 'term', value: 'first' },
    });

    // hook stores JSON-stringified values
    expect(localStorage.getItem('term')).toBe(JSON.stringify('first'));

    // update value using setter so hook persists new value
    act(() => {
      result.current[1]('second');
    });
    expect(localStorage.getItem('term')).toBe(JSON.stringify('second'));

    rerender({ key: 'term-2', value: 'another' });
    act(() => {
      result.current[1]('another');
    });
    expect(localStorage.getItem('term-2')).toBe(JSON.stringify('another'));

    expect(setItemSpy).toHaveBeenCalled();
  });
});
