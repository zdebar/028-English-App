import { useState, useEffect, useCallback } from 'react';

interface UseArrayResult<T> {
  data: T[];
  currentIndex: number | null;
  setCurrentIndex: (index: number | null) => void;
  currentItem: T | null;
  error: string | null;
  loading: boolean;
  reload: () => void;
}

/**
 * A custom React hook for fetching data asynchronously.
 * It manages loading state, error handling, and provides a mechanism to trigger reloads.
 *
 * @template T - The type of the array item returned by the fetch function.
 * @param fetchFunction - An asynchronous function that fetches an array of items.
 * @returns An object containing:
 *   - data: The fetched array or null if not yet fetched.
 *   - currentIndex: The index of the currently selected item, or null if none is selected. On reload currentIndex stays the same.
 *   - setCurrentIndex: Function to update the current index.If the index is out of bounds, currentItem will be null.
 *   - currentItem: The currently selected item, or null if none is selected.
 *   - error: Indicates if there was an error during the fetch.
 *   - loading: Indicates if the data is currently being fetched.
 *   - reload: Function to trigger a reload of the data.
 */
export function useArray<T>(fetchFunction: () => Promise<T[]>): UseArrayResult<T> {
  if (typeof fetchFunction !== 'function') {
    throw new TypeError('fetchFunction must be a function.');
  }

  const [data, setData] = useState<T[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const currentItem =
    currentIndex != null && currentIndex >= 0 && currentIndex < data.length
      ? data[currentIndex]
      : null;

  const load = useCallback(async () => {
    setLoading(true);
    let isActive = true;
    try {
      const result = await fetchFunction();
      if (!isActive) return;
      setData(result);
      setError(null);
      setCurrentIndex(null);
    } catch (error) {
      if (!isActive) return;
      setError(error instanceof Error ? error.message : String(error));
      setData([]);
      setCurrentIndex(null);
    } finally {
      if (isActive) setLoading(false);
    }
    return () => {
      isActive = false;
    };
  }, [fetchFunction]);

  useEffect(() => {
    let isActive = true;
    load();
    return () => {
      isActive = false;
    };
  }, [load]);

  return {
    data,
    currentIndex,
    setCurrentIndex,
    currentItem,
    error,
    loading,
    reload: load,
  };
}
