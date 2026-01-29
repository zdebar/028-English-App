import { useState, useEffect } from 'react';
import { TEXTS } from '@/config/texts.config';

/**
 * A custom React hook for fetching data asynchronously.
 * It manages loading state, error handling, and provides a mechanism to trigger reloads.
 *
 * @template T - The type of the data returned by the fetch function.
 * @param fetchFunction - A memoized function (useCallback or stable reference) that returns a Promise...
 *   Passing a new function on each render will cause repeated fetching.
 * @returns An object containing:
 *   - `data`: The fetched data of type T, or null if not yet fetched or on error.
 *   - `error`: A string error message if the fetch failed, or null otherwise.
 *   - `loading`: A boolean indicating whether the fetch is currently in progress.
 *   - `reload`: A function to trigger a re-fetch of the data.
 */
export function useFetch<T>(fetchFunction: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [shouldReload, setShouldReload] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  const reload = () => setShouldReload(true);

  return {
    data,
    error,
    loading,
    reload,
  };
}
