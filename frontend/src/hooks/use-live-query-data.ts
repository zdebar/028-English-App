import { liveQuery } from 'dexie';
import { useEffect, useRef, useState } from 'react';

type UseLiveQueryDataOptions<T> = Readonly<{
  emptyData: T;
  initialData?: T;
}>;

type UseLiveQueryDataResult<T> = Readonly<{
  data: T;
  loading: boolean;
  error: Error | null;
}>;

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

/** Keeps query data synchronized with every IndexedDB table read by the query. */
export function useLiveQueryData<T>(
  query: () => Promise<T>,
  options: UseLiveQueryDataOptions<T>,
): UseLiveQueryDataResult<T> {
  const hasInitialData = options.initialData !== undefined;
  const [data, setData] = useState<T>(() => options.initialData ?? options.emptyData);
  const [loading, setLoading] = useState(!hasInitialData);
  const [error, setError] = useState<Error | null>(null);
  const hasDataRef = useRef(hasInitialData);

  useEffect(() => {
    if (options.initialData === undefined) return;
    hasDataRef.current = true;
    setData(options.initialData);
    setError(null);
    setLoading(false);
  }, [options.initialData]);

  useEffect(() => {
    let isActive = true;
    setError(null);
    if (!hasDataRef.current) setLoading(true);

    const subscription = liveQuery(query).subscribe({
      next: (nextData) => {
        if (!isActive) return;
        hasDataRef.current = true;
        setData(nextData);
        setError(null);
        setLoading(false);
      },
      error: (queryError) => {
        if (!isActive) return;
        setError(toError(queryError));
        setLoading(false);
      },
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, [query]);

  return { data, loading, error };
}
