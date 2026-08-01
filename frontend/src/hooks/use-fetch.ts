import { useAsyncData } from './use-async-data';

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
  const { data, loading, error, reload } = useAsyncData<T | null>(fetchFunction, {
    emptyData: null,
    initialData: options.initialData,
  });

  return {
    data,
    hasData: data !== null,
    loading,
    error,
    reload,
  };
}
