import UserItem from '@/database/models/user-items';
import Topic from '@/database/models/topics';
import { reportError } from '@/features/logging/monitoring-handler';
import { useToastStore } from '@/features/toast/use-toast-store';
import { TEXTS } from '@/locales/cs';
import { getSharedQuery, sharedQueryKey } from './shared-query-store';
import { useEffect, useState } from 'react';
import type { OverviewAvailabilityData } from '@/routing/route-data';

export type OverviewAvailability = Readonly<{
  hasData: boolean;
  loading: boolean;
  error: Error | null;
}>;

export type OverviewAvailabilityState = Readonly<{
  grammar: OverviewAvailability;
  topics: OverviewAvailability;
  vocabulary: OverviewAvailability;
}>;

type DatabaseOverviewKey = keyof OverviewAvailabilityState;

const EMPTY_AVAILABILITY: OverviewAvailability = {
  hasData: false,
  loading: false,
  error: null,
};

const LOADING_AVAILABILITY: OverviewAvailability = {
  hasData: false,
  loading: true,
  error: null,
};

const INITIAL_DATABASE_STATE: OverviewAvailabilityState = {
  grammar: EMPTY_AVAILABILITY,
  topics: EMPTY_AVAILABILITY,
  vocabulary: EMPTY_AVAILABILITY,
};

const LOADING_DATABASE_STATE: OverviewAvailabilityState = {
  grammar: LOADING_AVAILABILITY,
  topics: LOADING_AVAILABILITY,
  vocabulary: LOADING_AVAILABILITY,
};

/** Observes whether each overview currently has at least one displayable item. */
export function useOverviewAvailability(
  userId: string | null,
  initialData?: OverviewAvailabilityData,
): OverviewAvailabilityState {
  const showToast = useToastStore((state) => state.showToast);
  const [databaseState, setDatabaseState] = useState(() =>
    initialData
      ? {
          grammar: { hasData: initialData.grammar, loading: false, error: null },
          topics: { hasData: initialData.topics, loading: false, error: null },
          vocabulary: { hasData: initialData.vocabulary, loading: false, error: null },
        }
      : INITIAL_DATABASE_STATE,
  );

  useEffect(() => {
    if (!userId) {
      setDatabaseState(INITIAL_DATABASE_STATE);
      return;
    }

    let isActive = true;
    if (!initialData) setDatabaseState(LOADING_DATABASE_STATE);

    const queries: ReadonlyArray<readonly [DatabaseOverviewKey, () => Promise<boolean>]> = [
      ['grammar', () => UserItem.hasInitiatedGrammar(userId)],
      ['topics', () => Topic.hasInitiatedByUserId(userId)],
      ['vocabulary', () => UserItem.hasInitiatedVocabulary(userId)],
    ];

    const subscriptions = queries.map(([key, query]) => {
      const sharedKey = sharedQueryKey(userId, `has-${key}`)!;
      const { store } = getSharedQuery(sharedKey, query);
      const update = () => {
        if (!isActive) return;
        const { data, loading, error } = store.getState();
        if (loading) return;
        setDatabaseState((current) => ({
          ...current,
          [key]: { hasData: data ?? false, loading: false, error },
        }));
        if (error) {
          reportError(`Failed to observe ${key} overview availability`, error);
          showToast(TEXTS.loadingError, 'error');
        }
      };
      const unsubscribe = store.subscribe(update);
      update();
      return unsubscribe;
    });

    return () => {
      isActive = false;
      subscriptions.forEach((unsubscribe) => unsubscribe());
    };
  }, [initialData, showToast, userId]);

  return databaseState;
}
