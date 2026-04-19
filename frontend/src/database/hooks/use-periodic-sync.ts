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
  const isDisposed = useRef(false);
  const intervalId = useRef<NodeJS.Timeout | null>(null);
  const initialSyncTimeoutId = useRef<number | null>(null);

  const showToast = useToastStore((state) => state.showToast);
  const setSynchronized = useSyncWarningStore((state) => state.setSynchronized);

  useEffect(() => {
    if (!userId) return;
    isDisposed.current = false;

    const runSync = async () => {
      if (inFlightSync.current) {
        await inFlightSync.current;
        return;
      }
      inFlightSync.current = (async () => {
        setLoading(true);
        try {
          if (userId) {
            const userResults = await Promise.allSettled([dataSync(userId), audioSync(userId)]);
            const isError = logRejectedResults(userResults, 'Data synchronization error:');
            if (isError) throw new Error('Data synchronization error');
            void AudioRecord.removeOrphaned();
          }
          showToast(TEXTS.syncSuccessToast, 'success');
          setSynchronized(true);
        } catch (error) {
          showToast(TEXTS.syncErrorToast, 'error');
          setSynchronized(false);
          errorHandler('Data synchronization failed', error);
        } finally {
          if (!isDisposed.current) {
            setLoading(false);
          }
        }
      })();
      try {
        await inFlightSync.current;
      } finally {
        inFlightSync.current = null;
      }
    };

    // Defer the first heavy sync to keep startup render path short (better FCP/LCP).
    initialSyncTimeoutId.current = window.setTimeout(() => {
      void runSync();
    }, 3000);
    intervalId.current = setInterval(runSync, config.sync.periodicSyncInterval);

    return () => {
      isDisposed.current = true;
      if (initialSyncTimeoutId.current) {
        window.clearTimeout(initialSyncTimeoutId.current);
      }
      if (intervalId.current) clearInterval(intervalId.current);
      if (userId) {
        void dataSyncOnUnmount(userId).catch((error) => {
          errorHandler('Unmount synchronization failed', error);
        });
      }
    };
  }, [userId]);

  return { loading };
}
