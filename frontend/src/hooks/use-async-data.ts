import { useCallback, useEffect, useRef, useState } from 'react';

type UseAsyncDataOptions<T> = Readonly<{
  emptyData: T;
  initialData?: T;
}>;

type UseAsyncDataResult<T> = Readonly<{
  data: T;
  loading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
}>;

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

/** Shared async loading lifecycle for data hooks with different empty-data semantics. */
export function useAsyncData<T>(
  fetchFunction: () => Promise<T>,
  options: UseAsyncDataOptions<T>,
): UseAsyncDataResult<T> {
  if (typeof fetchFunction !== 'function') {
    throw new TypeError('fetchFunction must be a function.');
  }

  const hasInitialData = options.initialData !== undefined;
  const [data, setData] = useState<T>(() => options.initialData ?? options.emptyData);
  const [loading, setLoading] = useState(!hasInitialData);
  const [error, setError] = useState<Error | null>(null);
  const emptyDataRef = useRef(options.emptyData);
  const isActiveRef = useRef(true);
  const initialFetchFunctionRef = useRef(hasInitialData ? fetchFunction : null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchFunction();
      if (!isActiveRef.current) return;
      setData(result);
    } catch (loadError) {
      if (!isActiveRef.current) return;
      setError(toError(loadError));
      setData(emptyDataRef.current);
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

  return { data, loading, error, reload: load };
}
