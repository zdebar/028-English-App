import { refreshPracticeAvailability } from '@/features/practice/practice-availability-controller';
import { useEffect, useRef } from 'react';
import config from '@/config/config';
import AudioRecord from '@/database/models/audio-records';
import { dataSync, dataSyncBeforeSessionEnd } from '@/database/sync/data-sync';
import { reportError, reportInfo } from '@/features/logging/logging-handler';
import { TEXTS } from '@/locales/cs';
import { useToastStore } from '@/features/toast/use-toast-store';
import { useSyncStore } from './use-sync-store';
import { useAuthStore } from '@/features/auth/use-auth-store';
import {
  clearPracticeCache,
  invalidatePracticeCache,
  warmPracticeCache,
} from '@/features/practice/practice-prefetch';
import { warmOverviewQueries } from '@/hooks/overview-query-store';

type InFlightSync = Readonly<{
  userId: string;
  kind: 'full' | 'session-end';
  promise: Promise<void>;
}>;

/**
 * Runs initial, periodic, and unmount data synchronization for a signed-in user.
 *
 * @param userId User id to sync. Null resets sync state and skips scheduling.
 * @returns Loading flag from the sync store. Same-user overlapping full syncs reuse the in-flight
 * promise; a sync for a new user waits for the previous user's operation to finish.
 */
export function usePeriodicSync(userId: string | null): { loading: boolean } {
  const inFlightSync = useRef<InFlightSync | null>(null);
  const intervalId = useRef<ReturnType<typeof setInterval> | null>(null);
  const initialSyncTimeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useToastStore((state) => state.showToast);
  const resetSyncState = useSyncStore((state) => state.resetSyncState);
  const setSynchronized = useSyncStore((state) => state.setSynchronized);
  const setSynchronizing = useSyncStore((state) => state.setSynchronizing);
  const setSyncError = useSyncStore((state) => state.setSyncError);
  const isSynchronizing = useSyncStore((state) => state.isSynchronizing);

  useEffect(() => {
    if (!userId) {
      resetSyncState();
      clearPracticeCache(null);
      return;
    }

    const activeUserId = userId;
    let isActive = true;
    setSynchronizing(true);

    const performSync = async () => {
      if (!isActive) return;
      setSynchronizing(true);
      try {
        try {
          await dataSync(activeUserId);
        } finally {
          // A partially failed sync may still have committed updated item data.
          invalidatePracticeCache(activeUserId);
          void warmPracticeCache(activeUserId).catch((error) => {
            reportError('Failed to prefetch practice cache', error);
          });
          void refreshPracticeAvailability(activeUserId).catch((error) => {
            reportError('Failed to refresh practice availability after sync', error);
          });
        }
        if (!isActive) return;

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

        if (isActive) {
          showToast(TEXTS.syncSuccessToast, 'success');
          setSynchronized(true);
          setSyncError(false);
        }
      } catch (error) {
        if (isActive) {
          showToast(TEXTS.syncErrorToast, 'error');
          setSynchronized(false);
          setSyncError(true);
        }
        reportError('Data synchronization failed', error);
      } finally {
        if (isActive) {
          setSynchronizing(false);
        }
      }
    };

    const runSync = async () => {
      if (!isActive) return;

      while (inFlightSync.current !== null) {
        const currentSync = inFlightSync.current;
        await currentSync.promise;
        if (!isActive) return;
        if (currentSync.userId === activeUserId && currentSync.kind === 'full') return;
      }

      if (!isActive) return;

      const syncPromise = performSync();
      let currentSync: InFlightSync | null = null;
      const trackedPromise = syncPromise.finally(() => {
        if (inFlightSync.current === currentSync) {
          inFlightSync.current = null;
        }
      });
      currentSync = {
        userId: activeUserId,
        kind: 'full',
        promise: trackedPromise,
      };
      inFlightSync.current = currentSync;

      await trackedPromise;
    };

    initialSyncTimeoutId.current = globalThis.setTimeout(() => {
      void runSync();
    }, 3000);
    void warmPracticeCache(activeUserId).catch((error) => {
      reportError('Failed to prefetch practice cache', error);
    });
    void warmOverviewQueries(activeUserId).catch((error) => {
      reportError('Failed to prefetch overview queries', error);
    });
    intervalId.current = setInterval(() => {
      void runSync();
    }, config.sync.periodicSyncInterval);

    return () => {
      isActive = false;

      if (initialSyncTimeoutId.current) {
        globalThis.clearTimeout(initialSyncTimeoutId.current);
        initialSyncTimeoutId.current = null;
      }

      if (intervalId.current) {
        clearInterval(intervalId.current);
        intervalId.current = null;
      }

      resetSyncState();

      // Logout already syncs before clearing auth. On account changes, avoid
      // syncing the old user's rows with the newly active Supabase session.
      const currentUserId = useAuthStore.getState().userId;
      if (currentUserId !== null && currentUserId !== activeUserId) return;

      const previousSync = inFlightSync.current;
      if (previousSync?.userId === activeUserId && previousSync.kind === 'session-end') return;

      const sessionEndPromise = (async () => {
        if (previousSync) await previousSync.promise;
        const latestUserId = useAuthStore.getState().userId;
        if (latestUserId !== null && latestUserId !== activeUserId) return;
        await dataSyncBeforeSessionEnd(activeUserId);
      })().catch((error) => {
        reportError('Session end synchronization failed', error);
      });
      let sessionEndSync: InFlightSync | null = null;
      const trackedSessionEndPromise = sessionEndPromise.finally(() => {
        if (inFlightSync.current === sessionEndSync) {
          inFlightSync.current = null;
        }
      });
      sessionEndSync = {
        userId: activeUserId,
        kind: 'session-end',
        promise: trackedSessionEndPromise,
      };
      inFlightSync.current = sessionEndSync;
    };
  }, [resetSyncState, setSynchronizing, setSynchronized, setSyncError, showToast, userId]);

  return { loading: isSynchronizing };
}
