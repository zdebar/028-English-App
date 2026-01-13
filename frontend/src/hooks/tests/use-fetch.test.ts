import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, type MockedFunction } from 'vitest';
import { useFetch } from '../use-fetch';

describe('useFetch', () => {
  let mockFetchFunction: MockedFunction<() => Promise<string>>;

  beforeEach(() => {
    mockFetchFunction = vi.fn<() => Promise<string>>();
  });

  // Initial states
  it('should initialize with correct default states', () => {
    const { result } = renderHook(() => useFetch(mockFetchFunction));
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(true);
    expect(result.current.shouldReload).toBe(true);
  });

  // Main behavior
  it('should fetch data successfully and update states', async () => {
    mockFetchFunction.mockResolvedValue('test data');
    const { result } = renderHook(() => useFetch(mockFetchFunction));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockFetchFunction).toHaveBeenCalledTimes(1);
    expect(result.current.data).toBe('test data');
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.shouldReload).toBe(false);
  });

  // Error handling
  it('should handle fetch error and update states', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockFetchFunction.mockRejectedValue(new Error('Fetch failed'));
    const { result } = renderHook(() => useFetch(mockFetchFunction));
    expect(result.current.loading).toBe(true);
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.shouldReload).toBe(false);
    });
    expect(mockFetchFunction).toHaveBeenCalledTimes(1);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('Chyba při načítání.');
    expect(result.current.loading).toBe(false);
    expect(result.current.shouldReload).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalledWith(new Error('Fetch failed'));
    consoleErrorSpy.mockRestore();
  });

  // External interaction: Should not refetch if shouldReload is false
  it('should not refetch if shouldReload is false', async () => {
    mockFetchFunction.mockResolvedValue('test data');
    const { result } = renderHook(() => useFetch(mockFetchFunction));
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    act(() => {
      result.current.setShouldReload(false);
    });
    await new Promise((r) => setTimeout(r, 0));
    expect(mockFetchFunction).toHaveBeenCalledTimes(1);
  });

  // External interaction: Should refetch when setShouldReload is called with true
  it('should refetch when setShouldReload is called with true', async () => {
    mockFetchFunction.mockResolvedValueOnce('first data').mockResolvedValueOnce('second data');
    const { result } = renderHook(() => useFetch(mockFetchFunction));
    await waitFor(() => {
      expect(result.current.data).toBe('first data');
      expect(result.current.loading).toBe(false);
    });
    act(() => {
      result.current.setShouldReload(true);
    });
    expect(result.current.loading).toBe(true);
    await waitFor(() => {
      expect(result.current.data).toBe('second data');
      expect(result.current.loading).toBe(false);
    });
    expect(mockFetchFunction).toHaveBeenCalledTimes(2);
    expect(result.current.data).toBe('second data');
  });

  // External interaction: Should not refetch if fetchFunction changes but shouldReload is false
  it('should not refetch if fetchFunction changes but shouldReload is false', async () => {
    mockFetchFunction.mockResolvedValue('initial data');
    const { rerender } = renderHook(({ fetchFn }) => useFetch(fetchFn), {
      initialProps: { fetchFn: mockFetchFunction },
    });
    await waitFor(() => {
      expect(mockFetchFunction).toHaveBeenCalledTimes(1);
    });
    const newMockFetchFunction = vi.fn().mockResolvedValue('new data');
    rerender({ fetchFn: newMockFetchFunction });
    expect(newMockFetchFunction).not.toHaveBeenCalled();
  });

  // Edge case: What happens if fetchFunction throws synchronously?
  it('should handle synchronous errors from fetchFunction', async () => {
    mockFetchFunction.mockImplementation(() => {
      throw new Error('Sync error');
    });
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useFetch(mockFetchFunction));
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.error).toBe('Chyba při načítání.');
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  // Edge case: What happens if setShouldReload is called multiple times quickly?
  it('should only fetch once if setShouldReload(true) is called multiple times before fetch completes', async () => {
    let resolveFn: (value: string) => void;
    mockFetchFunction.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFn = resolve;
        }),
    );
    const { result } = renderHook(() => useFetch(mockFetchFunction));
    act(() => {
      result.current.setShouldReload(true);
      result.current.setShouldReload(true);
      result.current.setShouldReload(true);
    });
    expect(mockFetchFunction).toHaveBeenCalledTimes(1);
    act(() => {
      resolveFn!('done');
    });
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.data).toBe('done');
  });

  // Performance: Should not refetch if shouldReload is false and fetchFunction is memoized
  it('should not refetch if fetchFunction is memoized and shouldReload is false', async () => {
    mockFetchFunction.mockResolvedValue('memoized data');
    const { result, rerender } = renderHook(({ fetchFn }) => useFetch(fetchFn), {
      initialProps: { fetchFn: mockFetchFunction },
    });
    await waitFor(() => {
      expect(result.current.data).toBe('memoized data');
    });
    rerender({ fetchFn: mockFetchFunction });
    expect(mockFetchFunction).toHaveBeenCalledTimes(1);
  });

  // Unsubscription/cleanup: Should not update state after unmount
  it('should not update state after unmount', async () => {
    let resolveFn: (value: string) => void;
    mockFetchFunction.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFn = resolve;
        }),
    );
    const { result, unmount } = renderHook(() => useFetch(mockFetchFunction));
    expect(result.current.loading).toBe(true);
    unmount();
    act(() => {
      resolveFn!('late data');
    });
    // Wait to ensure no state update occurs
    await new Promise((r) => setTimeout(r, 10));
    // No expect here: test passes if no error is thrown (no setState on unmounted)
  });

  // Edge case: What happens if fetchFunction returns undefined?
  it('should handle fetchFunction returning undefined', async () => {
    mockFetchFunction.mockResolvedValue(undefined as unknown as string);
    const { result } = renderHook(() => useFetch(mockFetchFunction));
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();
  });
});
