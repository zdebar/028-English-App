import {
  getOverviewQuery,
  overviewQueryKey,
  type OverviewAvailabilityData,
  type OverviewQueryName,
} from './overview-query-store';
import { observeSharedQuery } from '@/database/queries/shared-query-store';
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
      const unsubscribe = observeSharedQuery(
        overviewQueryKey(userId, queryName),
        queryName,
        getOverviewQuery(userId, queryName),
        ({ data, loading, error }) => {
          if (!isActive || loading) return;
          setDatabaseState((current) => ({
            ...current,
            [key]: { hasData: data ?? false, loading: false, error },
          }));
        },
      );
      return unsubscribe;
    });

    return () => {
      isActive = false;
      subscriptions.forEach((unsubscribe) => unsubscribe());
    };
  }, [initialData, userId]);

  return databaseState;
}
