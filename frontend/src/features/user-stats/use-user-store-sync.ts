import config from '@/config/config';
import Levels from '@/database/models/levels';
import { reportError } from '@/features/logging/logging-handler';
import { useEffect, useState } from 'react';
import { observeSharedQuery, sharedQueryKey } from '@/hooks/shared-query-store';
import { toError } from '@/utils/error.utils';
import { useUserStore } from './use-user-store';

/**
 * Synchronizes dashboard level snapshots with IndexedDB and refreshes them when the local date changes.
 * Clears the snapshot when no user is signed in.
 *
 * @param userId The current user ID (null when signed out)
 */
export function useUserStoreSync(userId: string | null) {
  const [localDate, setLocalDate] = useState(getLocalDate);
  const clearLevels = useUserStore((state) => state.clearLevels);

  useEffect(() => {
    const intervalId = globalThis.setInterval(() => {
      setLocalDate((currentDate) => {
        const nextDate = getLocalDate();
        return currentDate === nextDate ? currentDate : nextDate;
      });
    }, config.sync.scoreResetCheckInterval);

    return () => globalThis.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (userId == null) {
      clearLevels();
      return;
    }

    let isActive = true;
    useUserStore.setState({
      levels: [],
      levelsLoading: true,
      levelsError: null,
    });

    const key = sharedQueryKey(userId, `user-stats:${localDate}`)!;
    const unsubscribe = observeSharedQuery(
      key,
      'user-stats',
      () => Levels.getOverview(userId, localDate),
      ({ data: levels, error }) => {
        if (error) {
          if (!isActive) return;
          useUserStore.setState({ levels: [], levelsLoading: false, levelsError: toError(error) });
          reportError('Error observing levels', error);
          return;
        }
        if (!isActive || !levels) return;
        useUserStore.setState({
          levels,
          levelsLoading: false,
          levelsError: null,
        });
      },
    );

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [userId, localDate, clearLevels]);
}

function getLocalDate(): string {
  return new Date(Date.now()).toLocaleDateString('en-CA');
}
