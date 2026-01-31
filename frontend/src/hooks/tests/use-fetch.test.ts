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

    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('handles fetch error', async () => {
    const fetchFunction = vi.fn().mockRejectedValue(new Error('fail'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useFetch(fetchFunction));

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);

    consoleErrorSpy.mockRestore();
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
});
