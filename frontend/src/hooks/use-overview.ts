import { useArray } from '@/hooks/use-array';
import { TEXTS } from '@/locales/cs';
import { useCallback } from 'react';
import { useToastStore } from '../features/toast/use-toast-store';
import { errorHandler } from '../features/logging/error-handler';
import type { RecordType } from '@/types/generic.types';

type UseOverviewProps<T extends RecordType> = Readonly<{
  fetchFunction: () => Promise<T[]>;
  resetFunction?: (item: T) => Promise<void>;
}>;

/**
 * Custom hook for managing overview data, including fetching a list of items, handling the current item state, and resetting progress.
 * @param param0 Object containing the fetch and reset functions.
 * @returns An object with the overview data and handlers.
 */
export function useOverview<T extends RecordType>({
  fetchFunction,
  resetFunction,
}: UseOverviewProps<T>) {
  const showToast = useToastStore((state) => state.showToast);

  const {
    data,
    currentIndex,
    currentItem,
    setCurrentIndex,
    reload,
    fetchError: error,
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
      reload();
      showToast(TEXTS.resetProgressSuccessToast, 'success');
    } catch (resetError) {
      showToast(TEXTS.resetProgressErrorToast, 'error');
      errorHandler('Failed to reset progress', resetError);
    }
  }, [currentItem, resetFunction, reload, showToast]);

  return {
    data,
    hasData: !!data && data.length > 0,
    currentIndex,
    currentItem,
    handleOpen,
    handleClose,
    handleReset,
    error,
    loading,
  };
}
