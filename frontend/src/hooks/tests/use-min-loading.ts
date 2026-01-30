import { renderHook, act } from '@testing-library/react-hooks';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useMinLoading } from '../use-min-loading';

describe('useMinLoading', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('respects minimum loading time', () => {
    const { result } = renderHook(() => useMinLoading(1000));

    act(() => {
      result.current.setLoading(true);
    });
    expect(result.current.isLoading).toBe(true);

    act(() => {
      result.current.setLoading(false);
    });
    // Timer still running, loading should be true
    expect(result.current.isLoading).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    // Timer finished, loading should be false
    expect(result.current.isLoading).toBe(false);
  });
});
