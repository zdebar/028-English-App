import { useEffect, useRef, useState } from 'react';
import { dataSync, dataSyncOnUnmount } from '../models/data-sync';
import AudioRecord from '../models/audio-records';
import { TEXTS } from '@/locales/cs';
import { getPartialSyncTime, setPartialSyncTime } from '../sync-time.utils';
import config from '@/config/config';
import { errorHandler } from '@/features/logging/error-handler';

/**
 * Hook that manages periodic data synchronization for a user.
 *
 * Performs data sync operations at regular intervals and on component mount.
 * Handles in-flight sync requests to prevent concurrent synchronization attempts.
 * Ensures cleanup and final sync when the component unmounts.
 *
 * @param userId - The unique identifier of the user to sync data for
 * @param showToast - Callback function to display toast notifications with success or error messages
 *
 * @returns An object containing:
 *   - loading: Boolean indicating whether a sync operation is currently in progress
 *
 * @example
 * const { loading } = usePeriodicSync(userId, showToast);
 */
export function usePeriodicSync(
  userId: string | null,
  showToast: (message: string, type: 'success' | 'error') => void,
) {
  const [loading, setLoading] = useState(false);
  const inFlightSync = useRef<Promise<void> | null>(null);
  const isDisposed = useRef(false);
  const intervalId = useRef<NodeJS.Timeout | null>(null);

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
            await dataSync(userId);
            void AudioRecord.removeOrphaned();
          }
          showToast(TEXTS.syncSuccessToast, 'success');
        } catch (error) {
          showToast(TEXTS.syncErrorToast, 'error');
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

    const checkAndSync = () => {
      const now = Date.now();
      const lastSyncTimestamp = getPartialSyncTime(userId);
      if (now - lastSyncTimestamp > config.sync.periodicSyncInterval) {
        void runSync();
        setPartialSyncTime(userId, now);
      }
    };

    void runSync();
    intervalId.current = setInterval(checkAndSync, config.sync.periodicSyncInterval);

    return () => {
      isDisposed.current = true;
      if (intervalId.current) clearInterval(intervalId.current);
      if (userId) {
        void dataSyncOnUnmount(userId).catch((error) => {
          errorHandler('Unmount synchronization failed', error);
        });
      }
    };
  }, [userId, showToast]);

  return { loading };
}
