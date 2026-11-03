import { useEffect } from 'react';
import { reportError } from '@/features/logging/logging-handler';
import { ensureDataPackage, initializeDataManager } from './data-store';

/** Initializes the central data manager whenever the authenticated account changes. */
export function useDataManagerLifecycle(userId: string | null, prepareHomePackage = false): void {
  useEffect(() => {
    void initializeDataManager(userId)
      .then(() => {
        if (userId && prepareHomePackage) return ensureDataPackage(userId, { kind: 'home' });
        return undefined;
      })
      .catch((error: unknown) => {
        reportError('Failed to initialize local application data', error);
      });
  }, [prepareHomePackage, userId]);
}
