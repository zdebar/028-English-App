import { getPronunciationGroupOverview } from '@/database/queries/pronunciation-group-queries';
import { useEffect } from 'react';
import { observeSharedQuery, sharedQueryKey } from '@/hooks/shared-query-store';
import { toError } from '@/utils/error.utils';
import { usePronunciationGroupsStore } from './use-pronunciation-groups-store';

/** Keeps one route-stable pronunciation-group snapshot synchronized with IndexedDB. */
export function usePronunciationGroupsStoreSync(userId: string | null) {
  const clear = usePronunciationGroupsStore((state) => state.clear);

  useEffect(() => {
    if (!userId) {
      clear();
      return;
    }

    const queryKey = sharedQueryKey(userId, 'pronunciation-overview');
    if (!queryKey) {
      clear();
      return;
    }

    let isActive = true;
    usePronunciationGroupsStore.setState({ groups: [], loading: true, error: null });

    const unsubscribe = observeSharedQuery(
      queryKey,
      'pronunciation',
      () => getPronunciationGroupOverview(userId),
      ({ data: groups, error }) => {
        if (!isActive) return;

        if (error) {
          usePronunciationGroupsStore.setState({
            groups: [],
            loading: false,
            error: toError(error),
          });
          return;
        }

        if (!groups) return;

        usePronunciationGroupsStore.setState({
          groups,
          loading: false,
          error: null,
        });
      },
    );

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [clear, userId]);
}
