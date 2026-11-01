import { useCallback, useEffect, useRef, useState } from 'react';
import { assertFunction } from '@/utils/assertions.utils';
import { toError } from '@/utils/error.utils';

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

/** Shared async loading lifecycle for data hooks with different empty-data semantics. */
export function useAsyncData<T>(
  fetchFunction: () => Promise<T>,
  options: UseAsyncDataOptions<T>,
): UseAsyncDataResult<T> {
  assertFunction(fetchFunction, 'fetchFunction');

  const hasInitialData = options.initialData !== undefined;

  const [data, setData] = useState<T>(() => options.initialData ?? options.emptyData);
  const [loading, setLoading] = useState(!hasInitialData);
  const [error, setError] = useState<Error | null>(null);
  const emptyDataRef = useRef(options.emptyData);
  const isActiveRef = useRef(true);
  const requestGenerationRef = useRef(0);
  const hasResolvedDataRef = useRef(hasInitialData);
  const initialFetchFunctionRef = useRef(hasInitialData ? fetchFunction : null);

  const load = useCallback(async () => {
    if (!isActiveRef.current) return;
    const requestGeneration = ++requestGenerationRef.current;
    setLoading(true);
    setError(null);

    try {
      const result = await fetchFunction();
      if (!isCurrentRequest(isActiveRef.current, requestGeneration, requestGenerationRef.current)) {
        return;
      }
      setData(result);
      hasResolvedDataRef.current = true;
    } catch (loadError) {
      if (!isCurrentRequest(isActiveRef.current, requestGeneration, requestGenerationRef.current)) {
        return;
      }
      setError(toError(loadError));
      if (!hasResolvedDataRef.current) setData(emptyDataRef.current);
    } finally {
      if (!isCurrentRequest(isActiveRef.current, requestGeneration, requestGenerationRef.current)) {
        return;
      }
      setLoading(false);
    }
  }, [fetchFunction]);

  useEffect(() => {
    isActiveRef.current = true;
    return () => {
      isActiveRef.current = false;
      requestGenerationRef.current += 1;
    };
  }, []);

  useEffect(() => {
    if (initialFetchFunctionRef.current === fetchFunction) return;
    void load();
  }, [fetchFunction, load]);

  return { data, loading, error, reload: load };
}

function isCurrentRequest(
  isActive: boolean,
  requestGeneration: number,
  currentGeneration: number,
): boolean {
  return isActive && requestGeneration === currentGeneration;
}
