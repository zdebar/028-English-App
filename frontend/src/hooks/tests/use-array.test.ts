import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const showToastMock = vi.fn();
const errorHandlerMock = vi.fn();

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    dataLoadingError: 'Data loading error',
  },
}));

vi.mock('@/features/toast/use-toast-store', () => ({
  useToastStore: (selector: (state: { showToast: typeof showToastMock }) => unknown) =>
    selector({ showToast: showToastMock }),
}));

vi.mock('@/features/logging/error-handler', () => ({
  errorHandler: (...args: unknown[]) => errorHandlerMock(...args),
}));

import { useArray } from '@/hooks/use-array';

describe('useArray', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches array successfully and exposes default state', async () => {
    const fetchFunction = vi.fn().mockResolvedValue(['a', 'b']);

    const { result } = renderHook(() => useArray(fetchFunction));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toEqual(['a', 'b']);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.currentIndex).toBeNull();
    expect(result.current.currentItem).toBeNull();
  });

  it('tracks current item by selected index', async () => {
    const fetchFunction = vi.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]);

    const { result } = renderHook(() => useArray(fetchFunction));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setCurrentIndex(1);
    });

    expect(result.current.currentIndex).toBe(1);
    expect(result.current.currentItem).toEqual({ id: 2 });
  });

  it('reload refetches data and resets selected index to null', async () => {
    let call = 0;
    const fetchFunction = vi.fn().mockImplementation(() => {
      call += 1;
      return Promise.resolve(call === 1 ? ['first'] : ['second']);
    });

    const { result } = renderHook(() => useArray(fetchFunction));
    await waitFor(() => expect(result.current.data).toEqual(['first']));

    act(() => {
      result.current.setCurrentIndex(0);
    });
    expect(result.current.currentItem).toBe('first');

    act(() => {
      result.current.reload();
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(['second']);
    });

    expect(result.current.currentIndex).toBeNull();
    expect(result.current.currentItem).toBeNull();
  });

  it('handles fetch error with toast and logging', async () => {
    const fetchFunction = vi.fn().mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useArray(fetchFunction));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Data loading error');
    });

    expect(showToastMock).toHaveBeenCalledWith('Data loading error', 'error');
    expect(errorHandlerMock).toHaveBeenCalledWith('Data Fetching Error', expect.any(Error));
    expect(result.current.data).toEqual([]);
  });
});
