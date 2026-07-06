import { useState, useEffect, useCallback, useRef } from 'react';

interface UseArrayResult<T> {
  data: T[];
  hasData: boolean;
  currentIndex: number | null;
  setCurrentIndex: (index: number | null) => void;
  currentItem: T | null;
  loading: boolean;
  error: Error | null;
  reload: () => void;
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

/**
 * Fetches an array and tracks selection state for list/detail views.
 *
 * @param fetchFunction Async loader returning the full item array.
 * @returns Data, loading/error state, a manual reload function, and the selected item.
 * `data` falls back to [] after failures, and `currentItem` is null when currentIndex is null
 * or outside the current data bounds.
 * @throws TypeError when fetchFunction is not a function.
 */
export function useArray<T>(fetchFunction: () => Promise<T[]>): UseArrayResult<T> {
  if (typeof fetchFunction !== 'function') {
    throw new TypeError('fetchFunction must be a function.');
  }

  const [data, setData] = useState<T[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const isActiveRef = useRef(true);

  const currentItem =
    currentIndex != null && currentIndex >= 0 && currentIndex < data.length
      ? data[currentIndex]
      : null;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchFunction();
      if (!isActiveRef.current) return;
      setData(result);
    } catch (err) {
      if (!isActiveRef.current) return;
      setError(toError(err));
      setData([]);
    } finally {
      if (!isActiveRef.current) return;
      setLoading(false);
    }
  }, [fetchFunction]);

  useEffect(() => {
    isActiveRef.current = true;
    load();

    return () => {
      isActiveRef.current = false;
    };
  }, [load]);

  return {
    data,
    hasData: data.length > 0,
    currentIndex,
    setCurrentIndex,
    currentItem,
    loading,
    error,
    reload: load,
  };
}
