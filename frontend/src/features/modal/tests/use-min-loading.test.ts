import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMinLoading } from '../use-min-loading';

describe('useMinLoading', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should start with isLoading false', () => {
    const { result } = renderHook(() => useMinLoading(1000));
    expect(result.current.isLoading).toBe(false);
  });

  it('should set isLoading true immediately after setIsLoading(true)', () => {
    const { result } = renderHook(() => useMinLoading(1000));
    act(() => {
      result.current.setIsLoading(true);
    });
    expect(result.current.isLoading).toBe(true);
  });

  it('should keep isLoading true for at least minLoadingTime', () => {
    const { result } = renderHook(() => useMinLoading(1000));
    act(() => {
      result.current.setIsLoading(true);
    });
    act(() => {
      result.current.setIsLoading(false);
    });
    expect(result.current.isLoading).toBe(true);
    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(result.current.isLoading).toBe(true);
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.isLoading).toBe(false);
  });

  it('should cleanup timer on unmount', () => {
    const { result, unmount } = renderHook(() => useMinLoading(1000));
    act(() => {
      result.current.setIsLoading(true);
    });
    unmount();
    // No error should occur
  });
});
