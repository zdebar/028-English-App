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
 * A custom React hook for fetching data asynchronously.
 * It manages loading state, and provides a mechanism to trigger reloads.
 *
 * @template T - The type of the array item returned by the fetch function.
 * @param fetchFunction - An asynchronous function that fetches an array of items.
 * @returns An object containing:
 *   - data: The fetched array or null if not yet fetched.
 *   - hasData: Indicates if there is any data available.
 *   - currentIndex: The index of the currently selected item, or null if none is selected. On reload currentIndex stays the same.
 *   - setCurrentIndex: Function to update the current index.If the index is out of bounds, currentItem will be null.
 *   - currentItem: The currently selected item, or null if none is selected.
 *   - loading: Indicates if the data is currently being fetched.
 *   - reload: Function to trigger a reload of the data.
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
