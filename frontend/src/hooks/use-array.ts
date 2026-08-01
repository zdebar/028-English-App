import { useState } from 'react';
import { useAsyncData } from './use-async-data';

interface UseArrayResult<T> {
  data: T[];
  hasData: boolean;
  currentIndex: number | null;
  setCurrentIndex: (index: number | null) => void;
  currentItem: T | null;
  loading: boolean;
  error: Error | null;
  reload: () => void;
}

type UseArrayOptions<T> = Readonly<{
  initialData?: T[];
}>;

/**
 * Fetches an array and tracks selection state for list/detail views.
 *
 * @param fetchFunction Async loader returning the full item array.
 * @returns Data, loading/error state, a manual reload function, and the selected item.
 * `data` falls back to [] after failures, and `currentItem` is null when currentIndex is null
 * or outside the current data bounds.
 * @throws TypeError when fetchFunction is not a function.
 */
export function useArray<T>(
  fetchFunction: () => Promise<T[]>,
  options: UseArrayOptions<T> = {},
): UseArrayResult<T> {
  const { data, loading, error, reload } = useAsyncData<T[]>(fetchFunction, {
    emptyData: [],
    initialData: options.initialData,
  });
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);

  const currentItem =
    currentIndex != null && currentIndex >= 0 && currentIndex < data.length
      ? data[currentIndex]
      : null;

  return {
    data,
    hasData: data.length > 0,
    currentIndex,
    setCurrentIndex,
    currentItem,
    loading,
    error,
    reload,
  };
}
