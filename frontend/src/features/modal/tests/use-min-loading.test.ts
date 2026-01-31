import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useMinLoading } from '../use-min-loading';

describe('useMinLoading', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('isLoading is false initially', () => {
    const { result } = renderHook(() => useMinLoading(500));
    expect(result.current.isLoading).toBe(false);
  });

  it('isLoading is true immediately after setIsLoading(true)', () => {
    const { result } = renderHook(() => useMinLoading(500));
    act(() => {
      result.current.setIsLoading(true);
    });
    expect(result.current.isLoading).toBe(true);
  });

  it('isLoading stays true for at least minLoadingTime', () => {
    const { result } = renderHook(() => useMinLoading(1000));
    act(() => {
      result.current.setIsLoading(true);
    });
    act(() => {
      result.current.setIsLoading(false);
    });
    // Should still be true because min time not elapsed
    expect(result.current.isLoading).toBe(true);
    // Advance time just before minLoadingTime
    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(result.current.isLoading).toBe(true);
    // Advance to minLoadingTime
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.isLoading).toBe(false);
  });

  it('isLoading is false after minLoadingTime if setIsLoading(false) called', () => {
    const { result } = renderHook(() => useMinLoading(500));
    act(() => {
      result.current.setIsLoading(true);
    });
    act(() => {
      result.current.setIsLoading(false);
    });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current.isLoading).toBe(false);
  });

  it('multiple setIsLoading(true) resets timer', () => {
    const { result } = renderHook(() => useMinLoading(1000));
    act(() => {
      result.current.setIsLoading(true);
    });
    act(() => {
      vi.advanceTimersByTime(500);
      result.current.setIsLoading(true);
    });
    act(() => {
      result.current.setIsLoading(false);
    });
    // Only 500ms passed since last setIsLoading(true), so still loading
    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(result.current.isLoading).toBe(true);
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.isLoading).toBe(false);
  });
});
