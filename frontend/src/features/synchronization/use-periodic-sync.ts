import { useEffect } from 'react';
import { dataSyncBeforeSessionEnd } from '@/database/sync/data-sync';
import { reportError } from '@/features/logging/logging-handler';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { useSyncStore } from './use-sync-store';
import { syncManager } from './sync-manager';

/** Connects the app lifecycle to the shared SyncManager instance. */
export function usePeriodicSync(userId: string | null): { loading: boolean } {
  const isSynchronizing = useSyncStore((state) => state.isSynchronizing);

  useEffect(() => {
    syncManager.start(userId);
    if (!userId) return () => syncManager.stop(null);

    const activeUserId = userId;
    return () => {
      syncManager.stop(activeUserId);
      const currentUserId = useAuthStore.getState().userId;
      if (currentUserId !== null && currentUserId !== activeUserId) return;

      const idlePromise = syncManager.waitForIdle();
      if (idlePromise) {
        void idlePromise
          .then(() => runSessionEndSync(activeUserId))
          .catch((error: unknown) => reportError('Session end synchronization failed', error));
        return;
      }
      void runSessionEndSync(activeUserId)
        .catch((error: unknown) => reportError('Session end synchronization failed', error));
    };
  }, [userId]);

  return { loading: isSynchronizing };
}

function runSessionEndSync(activeUserId: string): Promise<void> {
  const latestUserId = useAuthStore.getState().userId;
  if (latestUserId !== null && latestUserId !== activeUserId) return Promise.resolve();
  return dataSyncBeforeSessionEnd(activeUserId);
}
