import { useArray } from '@/hooks/use-array';
import { useCallback, useState } from 'react';
import type { RecordType } from '@/types/generic.types';

type UseOverviewProps<T extends RecordType> = Readonly<{
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
 *  - handleOpen: Function to open an item by index.
 *  - handleClose: Function to close the currently open item.
 *  - handleReset: Function to reset the currently selected item.
 *  - fetchError: Error message from the fetch operation, if any.
 *  - resetError: Error message from the reset operation, if any.
 *  - loading: Boolean indicating if the data is currently being fetched.
 */
export function useOverview<T extends RecordType>({
  fetchFunction,
  resetFunction,
}: UseOverviewProps<T>) {
  const [resetError, setResetError] = useState<string | null>(null);

  const {
    data,
    currentIndex,
    currentItem,
    setCurrentIndex,
    reload,
    error: fetchError,
    loading,
  } = useArray<T>(fetchFunction);

  const handleOpen = useCallback(
    (index: number) => {
      setCurrentIndex(index);
    },
    [setCurrentIndex],
  );

  const handleClose = useCallback(() => {
    setCurrentIndex(null);
  }, [setCurrentIndex]);

  const handleReset = useCallback(async () => {
    if (!currentItem || !resetFunction) return;
    try {
      await resetFunction(currentItem);
      setResetError(null);
      reload();
    } catch (resetError) {
      setResetError(resetError instanceof Error ? resetError.message : String(resetError));
    }
  }, [currentItem, resetFunction, reload]);

  return {
    data,
    hasData: !!data && data.length > 0,
    currentIndex,
    setCurrentIndex,
    currentItem,
    handleOpen,
    handleClose,
    handleReset,
    fetchError,
    resetError,
    loading,
  };
}
