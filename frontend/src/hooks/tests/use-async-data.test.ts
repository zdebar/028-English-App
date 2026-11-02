import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useAsyncData } from '../use-async-data';

const mockData = { foo: 'bar' };

describe('useAsyncData', () => {
  it('fetches data successfully', async () => {
    const fetchFunction = vi.fn().mockResolvedValue(mockData);

    const { result } = renderHook(() => useAsyncData<typeof mockData | null>(fetchFunction, { emptyData: null }));

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('handles fetch error and exposes error', async () => {
    const error = new Error('fail');
    const fetchFunction = vi.fn().mockRejectedValue(error);

    const { result } = renderHook(() => useAsyncData<typeof mockData | null>(fetchFunction, { emptyData: null }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe(error);
  });

  it('keeps the data null when fetch returns null', async () => {
    const fetchFunction = vi.fn().mockResolvedValue(null);

    const { result } = renderHook(() => useAsyncData<null>(fetchFunction, { emptyData: null }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
  });

  it('reload triggers fetch again', async () => {
    let callCount = 0;
    const fetchFunction = vi.fn().mockImplementation(() => {
      callCount++;
      return Promise.resolve({ value: callCount });
    });

    const { result } = renderHook(() => useAsyncData<{ value: number } | null>(fetchFunction, { emptyData: null }));

    await waitFor(() => {
      expect(result.current.data).toEqual({ value: 1 });
    });

    await act(async () => result.current.reload());

    await waitFor(() => {
      expect(result.current.data).toEqual({ value: 2 });
    });
  });

  it('uses initial loader data without a duplicate mount request and still reloads', async () => {
    const fetchFunction = vi.fn().mockResolvedValue({ value: 2 });
    const initialData = { value: 1 };
    const { result } = renderHook(() =>
      useAsyncData(fetchFunction, { emptyData: null, initialData }),
    );

    expect(result.current.data).toEqual({ value: 1 });
    expect(result.current.loading).toBe(false);
    expect(fetchFunction).not.toHaveBeenCalled();

    await act(async () => result.current.reload());
    expect(fetchFunction).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual({ value: 2 });
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

    const { result } = renderHook(() => useAsyncData<{ value: number } | null>(fetchFunction, { emptyData: null }));

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    act(() => {
      void result.current.reload();
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

  it('ignores stale results and errors from an older request', async () => {
    let resolveFirst: ((value: { value: number }) => void) | undefined;
    let rejectFirst: ((reason: Error) => void) | undefined;
    let resolveSecond: ((value: { value: number }) => void) | undefined;
    const fetchFunction = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<{ value: number }>((resolve, reject) => {
            resolveFirst = resolve;
            rejectFirst = reject;
          }),
      )
      .mockImplementationOnce(
        () =>
          new Promise<{ value: number }>((resolve) => {
            resolveSecond = resolve;
          }),
      );

    const { result } = renderHook(() => useAsyncData<{ value: number } | null>(fetchFunction, { emptyData: null }));
    await waitFor(() => expect(fetchFunction).toHaveBeenCalledTimes(1));

    act(() => {
      void result.current.reload();
    });
    await waitFor(() => expect(fetchFunction).toHaveBeenCalledTimes(2));

    act(() => {
      resolveSecond?.({ value: 2 });
    });
    await waitFor(() => expect(result.current.data).toEqual({ value: 2 }));

    act(() => {
      rejectFirst?.(new Error('stale failure'));
      resolveFirst?.({ value: 1 });
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual({ value: 2 });
    expect(result.current.error).toBeNull();
  });

  it('uses initial data only on mount', () => {
    const fetchFunction = vi.fn().mockResolvedValue('fetched');
    const { result, rerender } = renderHook(
      ({ initialData }: { initialData: string }) =>
        useAsyncData(fetchFunction, { emptyData: '', initialData }),
      { initialProps: { initialData: 'initial' } },
    );

    rerender({ initialData: 'replacement' });
    expect(result.current.data).toBe('initial');
    expect(result.current.loading).toBe(false);
    expect(fetchFunction).not.toHaveBeenCalled();
  });
});
