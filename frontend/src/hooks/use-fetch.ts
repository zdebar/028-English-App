import { useState, useEffect, useCallback, useRef } from 'react';

interface UseFetchResult<T> {
  data: T | null;
  hasData: boolean;
  loading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
}

type UseFetchOptions<T> = Readonly<{
  initialData?: T | null;
}>;

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

/**
 * Fetches nullable async data and exposes loading, error, and reload state.
 *
 * @param fetchFunction Async loader returning data or null when no record is available.
 * @returns Data, loading/error state, and a manual reload function. Failed loads set data to null.
 * @throws TypeError when fetchFunction is not a function.
 */
export function useFetch<T>(
  fetchFunction: () => Promise<T | null>,
  options: UseFetchOptions<T> = {},
): UseFetchResult<T> {
  if (typeof fetchFunction !== 'function') {
    throw new TypeError('fetchFunction must be a function.');
  }

  const hasInitialData = options.initialData !== undefined;
  const [data, setData] = useState<T | null>(options.initialData ?? null);
  const [loading, setLoading] = useState<boolean>(!hasInitialData);
  const [error, setError] = useState<Error | null>(null);
  const isActiveRef = useRef(true);
  const initialFetchFunctionRef = useRef(hasInitialData ? fetchFunction : null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchFunction();
      if (!isActiveRef.current) return;
      setData(result);
    } catch (err) {
      if (!isActiveRef.current) return;
      setError(toError(err));
      setData(null);
    } finally {
      if (!isActiveRef.current) return;
      setLoading(false);
    }
  }, [fetchFunction]);

  useEffect(() => {
    isActiveRef.current = true;
    return () => {
      isActiveRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (initialFetchFunctionRef.current === fetchFunction) return;
    void load();
  }, [fetchFunction, load]);

  useEffect(() => {
    if (options.initialData === undefined) return;
    setData(options.initialData);
    setError(null);
    setLoading(false);
  }, [options.initialData]);

  return {
    data,
    hasData: data !== null,
    loading,
    error,
    reload: load,
  };
}
