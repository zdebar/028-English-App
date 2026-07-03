import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useFetch } from '../use-fetch';

const mockData = { foo: 'bar' };

describe('useFetch', () => {
  it('fetches data successfully', async () => {
    const fetchFunction = vi.fn().mockResolvedValue(mockData);

    const { result } = renderHook(() => useFetch(fetchFunction));

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData);
    });

    expect(result.current.hasData).toBe(true);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('handles fetch error and exposes error', async () => {
    const error = new Error('fail');
    const fetchFunction = vi.fn().mockRejectedValue(error);

    const { result } = renderHook(() => useFetch(fetchFunction));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.hasData).toBe(false);
    expect(result.current.error).toBe(error);
  });

  it('keeps hasData false when fetch returns null', async () => {
    const fetchFunction = vi.fn().mockResolvedValue(null);

    const { result } = renderHook(() => useFetch(fetchFunction));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.hasData).toBe(false);
  });

  it('reload triggers fetch again', async () => {
    let callCount = 0;
    const fetchFunction = vi.fn().mockImplementation(() => {
      callCount++;
      return Promise.resolve({ value: callCount });
    });

    const { result } = renderHook(() => useFetch(fetchFunction));

    await waitFor(() => {
      expect(result.current.data).toEqual({ value: 1 });
    });

    act(() => {
      result.current.reload();
    });

    await waitFor(() => {
      expect(result.current.data).toEqual({ value: 2 });
    });
  });

  it('clears stale error before retrying', async () => {
    let resolveSecondLoad: ((value: { value: number }) => void) | undefined;
    const fetchFunction = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockImplementationOnce(
        () =>
          new Promise<{ value: number }>((resolve) => {
            resolveSecondLoad = resolve;
          }),
      );

    const { result } = renderHook(() => useFetch(fetchFunction));

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    act(() => {
      result.current.reload();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(true);
    });
    expect(result.current.error).toBeNull();

    act(() => {
      resolveSecondLoad?.({ value: 2 });
    });

    await waitFor(() => {
      expect(result.current.data).toEqual({ value: 2 });
    });
  });
});
