import { useState, useEffect } from 'react';
import { TEXTS } from '@/locales/cs';

/**
 * A custom React hook for fetching data asynchronously.
 * It manages loading state, error handling, and provides a mechanism to trigger reloads.
 *
 * @template T - The type of the data returned by the fetch function.
 * @param fetchFunction - A memoized function (useCallback or stable reference) that returns a Promise...
 * @property {T | null} data - The fetched data or null if not yet fetched.
 * @property {string | null} error - An error message if the fetch failed, otherwise null.
 * @property {boolean} loading - Indicates if the data is currently being fetched.
 * @property {() => void} reload - Function to trigger a reload of the data.
 * @returns Doesnt throw errors.
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
