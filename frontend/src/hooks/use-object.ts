import { TEXTS } from '@/locales/cs';
import { useState, useEffect } from 'react';

/**
 * Generic hook for fetching and managing a single object resource.
 * @param fetchFn Async function returning the object or null/undefined if not found.
 */
export function useObject<T>(fetchFn: () => Promise<T | null | undefined>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchFn();
        setData(result ?? null);
      } catch (err: any) {
        setError(TEXTS.dataLoadingError);
        setData(null);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [fetchFn]);

  return { data, loading, error };
}
