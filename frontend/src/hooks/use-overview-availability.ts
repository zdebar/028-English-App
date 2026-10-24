import { reportError } from '@/features/logging/monitoring-handler';
import { useToastStore } from '@/features/toast/use-toast-store';
import { TEXTS } from '@/locales/cs';
import {
  getOverviewSharedQuery,
  type OverviewAvailabilityData,
  type OverviewQueryName,
} from './overview-query-store';
import { useEffect, useState } from 'react';

export type OverviewAvailability = Readonly<{
  hasData: boolean;
  loading: boolean;
  error: Error | null;
}>;

export type OverviewAvailabilityState = Readonly<{
  grammar: OverviewAvailability;
  topics: OverviewAvailability;
  vocabulary: OverviewAvailability;
  sounds: OverviewAvailability;
}>;

type DatabaseOverviewKey = keyof OverviewAvailabilityState;
type OverviewAvailabilityQueryName = Extract<OverviewQueryName, `has-${string}`>;

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
  sounds: EMPTY_AVAILABILITY,
};

const LOADING_DATABASE_STATE: OverviewAvailabilityState = {
  grammar: LOADING_AVAILABILITY,
  topics: LOADING_AVAILABILITY,
  vocabulary: LOADING_AVAILABILITY,
  sounds: LOADING_AVAILABILITY,
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
          sounds: { hasData: initialData.sounds, loading: false, error: null },
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

    const queries: ReadonlyArray<readonly [DatabaseOverviewKey, OverviewAvailabilityQueryName]> = [
      ['grammar', 'has-grammar'],
      ['topics', 'has-topics'],
      ['vocabulary', 'has-vocabulary'],
      ['sounds', 'has-sounds'],
    ];

    const subscriptions = queries.map(([key, queryName]) => {
      const { store } = getOverviewSharedQuery(userId, queryName);
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
