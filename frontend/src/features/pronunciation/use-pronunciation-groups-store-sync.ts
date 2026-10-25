import PronunciationGroup from '@/database/models/pronunciation-groups';
import { reportError } from '@/features/logging/monitoring-handler';
import { useEffect } from 'react';
import { observeSharedQuery, sharedQueryKey } from '@/hooks/shared-query-store';
import { usePronunciationGroupsStore } from './use-pronunciation-groups-store';

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

/** Keeps one route-stable pronunciation-group snapshot synchronized with IndexedDB. */
export function usePronunciationGroupsStoreSync(userId: string | null) {
  const clear = usePronunciationGroupsStore((state) => state.clear);

  useEffect(() => {
    if (!userId) {
      clear();
      return;
    }

    let isActive = true;
    usePronunciationGroupsStore.setState({ groups: [], loading: true, error: null });

    const unsubscribe = observeSharedQuery(sharedQueryKey(userId, 'pronunciation-overview')!, 'pronunciation', () => PronunciationGroup.getOverview(userId), ({ data: groups, error }) => {
      if (error) {
        const normalizedError = toError(error);
        usePronunciationGroupsStore.setState({ groups: [], loading: false, error: normalizedError });
        reportError('Error observing pronunciation groups', normalizedError);
        return;
      }
      if (groups) {
        if (!isActive) return;
        usePronunciationGroupsStore.setState({
          groups: groups ?? [],
          loading: false,
          error: null,
        });
      }
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [clear, userId]);
}
