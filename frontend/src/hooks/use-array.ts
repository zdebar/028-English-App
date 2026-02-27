import { useState, useEffect } from 'react';
import { TEXTS } from '@/locales/cs';
import { errorHandler } from '@/features/logging/error-handler';
import { useToastStore } from '@/features/toast/use-toast-store';

interface UseArrayResult<T> {
  data: T[];
  currentIndex: number | null;
  currentItem: T | null;
  error: string | null;
  loading: boolean;
  reload: () => void;
  setCurrentIndex: (index: number | null) => void;
}

/**
 * A custom React hook for fetching data asynchronously.
 * It manages loading state, error handling, and provides a mechanism to trigger reloads.
 *
 * @template T - The type of the array item returned by the fetch function.
 * @param fetchFunction - An asynchronous function that fetches an array of items.
 * @returns An object containing:
 *   - data: The fetched array or null if not yet fetched.
 *   - error: An error message if the fetch failed, otherwise null.
 *   - loading: Indicates if the data is currently being fetched.
 *   - reload: Function to trigger a reload of the data.
 */
export function useArray<T>(fetchFunction: () => Promise<T[]>): UseArrayResult<T> {
  const showToast = useToastStore((state) => state.showToast);

  const [data, setData] = useState<T[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [reloading, setReloading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    async function fetchData() {
      if (!reloading) return;
      setLoading(true);

      try {
        const result = await fetchFunction();
        if (!isActive) return;
        setCurrentIndex(result.length > 0 ? 0 : null);
        setData(result);
        setError(null);
      } catch (error) {
        if (!isActive) return;
        setError(TEXTS.dataLoadingError);
        showToast(TEXTS.dataLoadingError, 'error');
        errorHandler('Data Fetching Error', error);
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

  const reload = () => {
    setLoading(true);
    setReloading(true);
  };

  return {
    data,
    currentIndex,
    currentItem: currentIndex !== null ? data[currentIndex] : null,
    error,
    loading,
    reload,
    setCurrentIndex,
  };
}
