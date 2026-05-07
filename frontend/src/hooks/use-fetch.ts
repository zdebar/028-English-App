import { useState, useEffect, useCallback, useRef } from 'react';

interface UseFetchResult<T> {
  data: T | null;
  hasData: boolean;
  loading: boolean;
  reload: () => void;
}

/**
 * A custom React hook for fetching data asynchronously.
 * It manages loading state, error handling, and provides a mechanism to trigger reloads.
 *
 * @template T - The type of the data returned by the fetch function.
 * @param fetchFunction - An asynchronous function that fetches the data.
 * @returns An object containing:
 *   - data: The fetched data or null if not yet fetched.
 *   - hasData: Indicates if there is any data available (data is not null).
 *   - loading: Indicates if the data is currently being fetched.
 *   - reload: Function to trigger a reload of the data.
 */
export function useFetch<T>(fetchFunction: () => Promise<T | null>): UseFetchResult<T | null> {
  if (typeof fetchFunction !== 'function') {
    throw new TypeError('fetchFunction must be a function.');
  }

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const isActiveRef = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const result = await fetchFunction();
      if (!isActiveRef.current) return;
      setData(result);
    } catch {
      if (!isActiveRef.current) return;
      setData(null);
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
    hasData: data !== null,
    loading,
    reload: load,
  };
}
