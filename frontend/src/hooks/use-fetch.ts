import { useState, useEffect } from "react";

/**
 * Generic data fetching hook.
 * @param fetchFunction - An asynchronous function that fetches data of type T.
 * @returns An object containing the fetched data, loading state, and any error message.
 */
export function useFetch<T>(fetchFunction: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [reload, setReload] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoadin] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!reload) return;
      setLoadin(true);

      try {
        setReload(false);
        const result = await fetchFunction();
        setData(result);
        setError(null);
      } catch (error) {
        setError("Chyba při načítání.");
        console.error(error);
      } finally {
        setLoadin(false);
        setReload(false);
      }
    }

    fetchData();
  }, [fetchFunction, reload]);

  return { data, error, loading, reload, setReload };
}
