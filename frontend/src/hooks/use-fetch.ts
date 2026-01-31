import { useState, useEffect } from 'react';
import { TEXTS } from '@/locales/cs';

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
export function useFetch<T>(fetchFunction: () => Promise<T>): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [shouldReload, setShouldReload] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    async function fetchData() {
      if (!shouldReload) return;
      setLoading(true);

      try {
        const result = await fetchFunction();
        if (!isActive) return;
        setData(result);
        setError(null);
      } catch (error) {
        if (!isActive) return;
        setError(TEXTS.dataLoadingError);
        console.error(error);
      } finally {
        if (isActive) {
          setLoading(false);
          setShouldReload(false);
        }
      }
    }

    fetchData();

    return () => {
      isActive = false;
    };
  }, [fetchFunction, shouldReload]);

  const reload = () => {
    setLoading(true);
    setShouldReload(true);
  };

  return {
    data,
    error,
    loading,
    reload,
  };
}
