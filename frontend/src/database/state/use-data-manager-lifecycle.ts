import { useEffect } from 'react';
import { reportError } from '@/features/logging/logging-handler';
import { initializeDataManager } from './data-store';

/** Initializes the central data manager whenever the authenticated account changes. */
export function useDataManagerLifecycle(userId: string | null): void {
  useEffect(() => {
    void initializeDataManager(userId).catch((error: unknown) => {
      reportError('Failed to initialize local application data', error);
    });
  }, [userId]);
}
