import { useArray } from '@/hooks/use-array';
import { useCallback, useState } from 'react';
import type { HookStatus } from '@/types/generic.types';

type UseOverviewProps<T> = Readonly<{
  fetchFunction: () => Promise<T[]>;
  resetFunction?: (item: T) => Promise<void>;
}>;

/**
 * Custom hook for managing overview data with fetch and reset capabilities.
 * @param param0 Object containing the fetch and reset functions.
 * @returns An object with the overview data and handlers.
 *  - data: The fetched data array.
 *  - hasData: Boolean indicating if there is data available.
 *  - currentIndex: The index of the currently selected item.
 *  - setCurrentIndex: Function to set the current index.
 *  - currentItem: The currently selected item.
 *  - handleReset: Function to reset the currently selected item.
 *  - fetchStatus: Current fetch state (idle/loading/success/error).
 *  - fetchError: Error message from the fetch operation, if any.
 *  - resetStatus: Current reset state (idle/loading/success/error).
 *  - resetError: Error message from the reset operation, if any.
 *  - loading: Boolean indicating if the data is currently being fetched.
 */
export function useOverview<T>({ fetchFunction, resetFunction }: UseOverviewProps<T>) {
  const [resetStatus, setResetStatus] = useState<HookStatus>('idle');
  const [resetError, setResetError] = useState<string | null>(null);

  const {
    data,
    currentIndex,
    setCurrentIndex,
    currentItem,
    status,
    reload,
    error: fetchError,
    loading,
  } = useArray<T>(fetchFunction);

  const handleReset = useCallback(async () => {
    if (!currentItem || !resetFunction) return;

    setResetStatus('loading');
    setResetError(null);

    try {
      await resetFunction(currentItem);
      setResetStatus('success');
      setResetError(null);
      reload();
    } catch (resetError) {
      setResetStatus('error');
      setResetError(resetError instanceof Error ? resetError.message : String(resetError));
    }
  }, [currentItem, resetFunction, reload]);

  return {
    data,
    hasData: !!data && data.length > 0,
    currentIndex,
    setCurrentIndex,
    currentItem,
    loading,
    handleReset,
    fetchStatus: status,
    fetchError,
    resetStatus,
    resetError,
  };
}
