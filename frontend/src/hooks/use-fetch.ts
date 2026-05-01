import { useState, useEffect, useCallback, useRef } from 'react';
import type { HookStatus } from '@/types/generic.types';

interface UseFetchResult<T> {
  data: T | null;
  status: HookStatus;
  error: string | null;
  loading: boolean;
  reload: () => void;
}

/**
 * A custom React hook for fetching data asynchronously.
 * It manages loading state, error handling, and provides a mechanism to trigger reloads.
 *
 * @template T - The type of the data returned by the fetch function.
 * @param fetchFunction - An asynchronous function that fetches the data.
 * @returns An object containing:
 *   - data: The fetched data or null if not yet fetched.
 *   - status: Current fetch status (idle/loading/success/error).
 *   - error: An error message if the fetch failed, otherwise null.
 *   - loading: Indicates if the data is currently being fetched.
 *   - reload: Function to trigger a reload of the data.
 */
export function useFetch<T>(fetchFunction: () => Promise<T | null>): UseFetchResult<T | null> {
  if (typeof fetchFunction !== 'function') {
    throw new TypeError('fetchFunction must be a function.');
  }

  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<HookStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const isActiveRef = useRef(true);

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);

    try {
      const result = await fetchFunction();

      if (!isActiveRef.current) return;

      setData(result);
      setError(null);
      setStatus('success');
    } catch (error) {
      if (!isActiveRef.current) return;

      setError(error instanceof Error ? error.message : String(error));
      setData(null);
      setStatus('error');
    }
  }, [fetchFunction]);

  useEffect(() => {
    isActiveRef.current = true;
    load();

    return () => {
      isActiveRef.current = false;
    };
  }, [load]);

  return {
    data,
    status,
    error,
    loading: status === 'loading',
    reload: load,
  };
}
