import { useEffect, useRef, useState } from 'react';
import { dataSyncOnUnmount, dataSync, audioSync } from '../utils/data-sync.utils';
import AudioRecord from '../models/audio-records';
import { TEXTS } from '@/locales/cs';
import config from '@/config/config';
import { errorHandler } from '@/features/logging/error-handler';
import { useToastStore } from '@/features/toast/use-toast-store';
import { logRejectedResults } from '@/features/logging/logging.utils';
import { useSyncWarningStore } from '@/features/sync-warning/use-sync-warning';

/**
 * Hook that manages periodic data synchronization for a user.
 *
 * Performs data sync operations at regular intervals and on component mount.
 * Handles in-flight sync requests to prevent concurrent synchronization attempts.
 * Ensures cleanup and final sync when the component unmounts.
 *
 * @param userId - The unique identifier of the user to sync data for
 *
 * @returns An object containing:
 *   - loading: Boolean indicating whether a sync operation is currently in progress
 *
 * @example
 * const { loading } = usePeriodicSync(userId);
 */
export function usePeriodicSync(userId: string | null) {
  const [loading, setLoading] = useState(false);
  const inFlightSync = useRef<Promise<void> | null>(null);
  const isUnmounted = useRef(false);
  const intervalId = useRef<ReturnType<typeof setInterval> | null>(null);
  const initialSyncTimeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useToastStore((state) => state.showToast);
  const setSynchronized = useSyncWarningStore((state) => state.setSynchronized);

  useEffect(() => {
    if (!userId) return;
    const activeUserId = userId;
    isUnmounted.current = false;

    const performSync = async () => {
      setLoading(true);
      try {
        const syncResults = await Promise.allSettled([
          dataSync(activeUserId),
          audioSync(activeUserId),
        ]);
        const isError = logRejectedResults(syncResults, 'Data synchronization error:');
        if (isError) throw new Error('Data synchronization error');

        AudioRecord.removeOrphaned();
        showToast(TEXTS.syncSuccessToast, 'success');
        setSynchronized(true);
      } catch (error) {
        showToast(TEXTS.syncErrorToast, 'error');
        setSynchronized(false);
        errorHandler('Data synchronization failed', error);
      } finally {
        if (!isUnmounted.current) {
          setLoading(false);
        }
      }
    };

    const runSync = async () => {
      // Reuse ongoing sync promise to avoid overlapping synchronization calls.
      if (inFlightSync.current) {
        await inFlightSync.current;
        return;
      }

      inFlightSync.current = (async () => {
        try {
          await performSync();
        } finally {
          inFlightSync.current = null;
        }
      })();

      await inFlightSync.current;
    };

    initialSyncTimeoutId.current = globalThis.setTimeout(() => {
      runSync();
    }, 3000);
    intervalId.current = setInterval(runSync, config.sync.periodicSyncInterval);

    return () => {
      isUnmounted.current = true;

      if (initialSyncTimeoutId.current) {
        globalThis.clearTimeout(initialSyncTimeoutId.current);
        initialSyncTimeoutId.current = null;
      }

      if (intervalId.current) {
        clearInterval(intervalId.current);
        intervalId.current = null;
      }

      dataSyncOnUnmount(activeUserId).catch((error) => {
        errorHandler('Unmount synchronization failed', error);
      });
    };
  }, [userId]);

  return { loading };
}
