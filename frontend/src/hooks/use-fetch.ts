import { useState, useEffect, useCallback } from 'react';

interface UseFetchResult<T> {
  data: T | null;
  error: string | null;
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
 *   - error: An error message if the fetch failed, otherwise null.
 *   - loading: Indicates if the data is currently being fetched.
 *   - reload: Function to trigger a reload of the data.
 */
export function useFetch<T>(fetchFunction: () => Promise<T | null>): UseFetchResult<T | null> {
  if (typeof fetchFunction !== 'function') {
    throw new TypeError('fetchFunction must be a function.');
  }

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    let isActive = true;
    setLoading(true);

    try {
      const result = await fetchFunction();
      if (!isActive) return;
      setData(result);
      setError(null);
    } catch (error) {
      if (!isActive) return;
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      if (isActive) {
        setLoading(false);
      }
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
    error,
    loading,
    reload: load,
  };
}
