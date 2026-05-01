import { useState, useEffect, useCallback } from 'react';
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
 *   - currentIndex: The index of the currently selected item, or null if none is selected.
 *   - setCurrentIndex: Function to update the current index.
 *   - currentItem: The currently selected item, or null if none is selected.
 *   - error: An error message if the fetch failed, otherwise null.
 *   - loading: Indicates if the data is currently being fetched.
 *   - reload: Function to trigger a reload of the data.
 */
export function useArray<T>(fetchFunction: () => Promise<T[]>): UseArrayResult<T> {
  if (typeof fetchFunction !== 'function') {
    throw new TypeError('fetchFunction must be a function.');
  }

  const showToast = useToastStore((state) => state.showToast);

  const [data, setData] = useState<T[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [reloading, setReloading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const currentItem = currentIndex != null && currentIndex >= 0 && currentIndex < data.length ? data[currentIndex] : null;

  useEffect(() => {
    let isActive = true;

    async function fetchData() {
      if (!reloading) return;
      setLoading(true);

      try {
        const result = await fetchFunction();
        if (!isActive) return;
        setData(result);
        setError(null);
      } catch (error) {
        if (!isActive) return;
        setError(TEXTS.dataLoadingError);
        setData([]);
        showToast(TEXTS.dataLoadingError, 'error');
        errorHandler('Data Fetching Error', error);
      } finally {
        if (isActive) {
          setCurrentIndex(null);
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
    currentIndex,
    setCurrentIndex,
    currentItem,
    error,
    loading,
    reload,    
  };
}
