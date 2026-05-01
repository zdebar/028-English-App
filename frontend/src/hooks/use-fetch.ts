import { useState, useEffect, useCallback } from 'react';

interface UseFetchResult<T> {
  data: T | null;
  fetchError: string | null;
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
 *   - fetchError: An error message if the fetch failed, otherwise null.
 *   - loading: Indicates if the data is currently being fetched.
 *   - reload: Function to trigger a reload of the data.
 */
export function useFetch<T>(fetchFunction: () => Promise<T | null>): UseFetchResult<T | null> {
  if (typeof fetchFunction !== 'function') {
    throw new TypeError('fetchFunction must be a function.');
  }

  const [data, setData] = useState<T | null>(null);
  const [reloading, setReloading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    async function fetchData() {
      if (!reloading) return;
      setLoading(true);

      try {
        const result = await fetchFunction();
        if (!isActive) return;
        setData(result);
        setFetchError(null);
      } catch (error) {
        if (!isActive) return;
        setFetchError(error instanceof Error ? error.message : String(error));
      } finally {
        if (isActive) {
          setLoading(false);
          setReloading(false);
        }
      }
    }

    fetchData();

    return () => {
      isActive = false;
    };
  }, [fetchFunction, reloading]);

  const reload = useCallback(() => {
    setLoading(true);
    setReloading(true);
  }, []);

  return {
    data,
    fetchError,
    loading,
    reload,
  };
}
