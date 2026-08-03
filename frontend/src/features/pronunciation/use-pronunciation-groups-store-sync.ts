import PronunciationGroup from '@/database/models/pronunciation-groups';
import { reportError } from '@/features/logging/monitoring-handler';
import { liveQuery } from 'dexie';
import { useEffect } from 'react';
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

    const subscription = liveQuery(() => PronunciationGroup.getOverview(userId)).subscribe({
      next: (groups) => {
        if (!isActive) return;
        usePronunciationGroupsStore.setState({
          groups: groups ?? [],
          loading: false,
          error: null,
        });
      },
      error: (error) => {
        if (!isActive) return;
        const normalizedError = toError(error);
        usePronunciationGroupsStore.setState({
          groups: [],
          loading: false,
          error: normalizedError,
        });
        reportError('Error observing pronunciation groups', normalizedError);
      },
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, [clear, userId]);
}
