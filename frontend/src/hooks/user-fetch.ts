import { useState, useEffect } from "react";

/**
 * Generic data fetching hook.
 * @param fetchFunction - An asynchronous function that fetches data of type T.
 * @returns An object containing the fetched data, loading state, and any error message.
 */
export function useFetch<T>(fetchFunction: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const result = await fetchFunction();
        setData(result);
      } catch (error) {
        setError("Chyba při načítání.");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [fetchFunction]);

  return { data, error, isLoading };
}
