import { useEffect, useRef, useState } from 'react';
import { TEXTS } from '@/locales/cs';
import config from '@/config/config';
import AudioRecord from '@/database/models/audio-records';
import { dataSync, dataSyncOnUnmount } from '@/database/utils/data-sync.utils';
import { reportError, reportInfo } from '@/features/logging/monitoring-handler';
import { useSyncWarningStore } from '@/features/sync/use-sync-warning';
import { useToastStore } from '@/features/toast/use-toast-store';

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
export function usePeriodicSync(userId: string | null): { loading: boolean } {
  const [loading, setLoading] = useState(false);
  const inFlightSync = useRef<Promise<void> | null>(null);
  const isUnmounted = useRef(false);
  const intervalId = useRef<ReturnType<typeof setInterval> | null>(null);
  const initialSyncTimeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useToastStore((state) => state.showToast);
  const setSynchronized = useSyncWarningStore((state) => state.setSynchronized);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const activeUserId = userId;
    isUnmounted.current = false;

    const performSync = async () => {
      setLoading(true);
      try {
        await dataSync(activeUserId);
        const audioSummary = await AudioRecord.syncFromRemote();
        if (audioSummary.failed > 0) {
          reportError('Audio archive sync errors', audioSummary.sampleErrors);
        }

        const orphanedCount = await AudioRecord.removeOrphaned();
        if (orphanedCount.failed > 0) {
          reportError('Audio archive sync errors', orphanedCount.sampleErrors);
        }
        if (orphanedCount.success > 0) {
          reportInfo(`Deleted ${orphanedCount.success} orphaned audio records.`);
        }

        showToast(TEXTS.syncSuccessToast, 'success');
        setSynchronized(true);
      } catch (error) {
        showToast(TEXTS.syncErrorToast, 'error');
        setSynchronized(false);
        reportError('Data synchronization failed', error);
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
        reportError('Unmount synchronization failed', error);
      });
    };
  }, [setSynchronized, showToast, userId]);

  return { loading };
}
