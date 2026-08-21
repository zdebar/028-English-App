import UserBlock from '@/database/models/user-blocks';
import UserItem from '@/database/models/user-items';
import { reportError } from '@/features/logging/monitoring-handler';
import { useToastStore } from '@/features/toast/use-toast-store';
import { TEXTS } from '@/locales/cs';
import { liveQuery } from 'dexie';
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

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

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
      ['grammar', () => UserItem.hasStartedGrammar(userId)],
      ['topics', async () => (await UserBlock.getStartedTopicsByUserId(userId)).length > 0],
      ['vocabulary', async () => (await UserItem.getStartedVocabulary(userId)).length > 0],
    ];

    const subscriptions = queries.map(([key, query]) =>
      liveQuery(query).subscribe({
        next: (hasData) => {
          if (!isActive) return;
          setDatabaseState((current) => ({
            ...current,
            [key]: { hasData, loading: false, error: null },
          }));
        },
        error: (error) => {
          if (!isActive) return;
          const normalizedError = toError(error);
          setDatabaseState((current) => ({
            ...current,
            [key]: { hasData: false, loading: false, error: normalizedError },
          }));
          reportError(`Failed to observe ${key} overview availability`, normalizedError);
          showToast(TEXTS.loadingError, 'error');
        },
      }),
    );

    return () => {
      isActive = false;
      subscriptions.forEach((subscription) => subscription.unsubscribe());
    };
  }, [initialData, showToast, userId]);

  return databaseState;
}
