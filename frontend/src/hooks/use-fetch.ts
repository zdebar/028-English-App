import { useState, useEffect } from "react";

/**
 * Generic data fetching hook.
 * @param fetchFunction - An asynchronous function that fetches data of type T.
 * @returns An object containing the fetched data, loading state, and any error message.
 */
export function useFetch<T>(fetchFunction: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [shouldReload, setShouldReload] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!shouldReload) return;
      setLoading(true);

      try {
        const result = await fetchFunction();
        setData(result);
        setError(null);
      } catch (error) {
        setError("Chyba při načítání.");
        console.error(error);
      } finally {
        setLoading(false);
        setShouldReload(false);
      }
    }

    fetchData();
  }, [fetchFunction, shouldReload]);

  return {
    data,
    error,
    loading,
    shouldReload,
    setShouldReload,
  };
}
