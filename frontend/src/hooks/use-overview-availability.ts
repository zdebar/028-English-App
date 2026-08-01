import GrammarGroup from '@/database/models/grammar-groups';
import PronunciationGroup from '@/database/models/pronunciation-groups';
import UserBlock from '@/database/models/user-blocks';
import UserItem from '@/database/models/user-items';
import UserScore from '@/database/models/user-scores';
import { reportError } from '@/features/logging/monitoring-handler';
import { useToastStore } from '@/features/toast/use-toast-store';
import { useUserStore } from '@/features/user-stats/use-user-store';
import { TEXTS } from '@/locales/cs';
import { liveQuery } from 'dexie';
import { useEffect, useState } from 'react';

export type OverviewAvailability = Readonly<{
  hasData: boolean;
  loading: boolean;
  error: Error | null;
}>;

export type OverviewAvailabilityState = Readonly<{
  practice: OverviewAvailability;
  levels: OverviewAvailability;
  grammar: OverviewAvailability;
  topics: OverviewAvailability;
  vocabulary: OverviewAvailability;
  pronunciation: OverviewAvailability;
}>;

type DatabaseOverviewKey = Exclude<keyof OverviewAvailabilityState, 'levels'>;

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

const INITIAL_DATABASE_STATE: Omit<OverviewAvailabilityState, 'levels'> = {
  practice: EMPTY_AVAILABILITY,
  grammar: EMPTY_AVAILABILITY,
  topics: EMPTY_AVAILABILITY,
  vocabulary: EMPTY_AVAILABILITY,
  pronunciation: EMPTY_AVAILABILITY,
};

const LOADING_DATABASE_STATE: Omit<OverviewAvailabilityState, 'levels'> = {
  practice: LOADING_AVAILABILITY,
  grammar: LOADING_AVAILABILITY,
  topics: LOADING_AVAILABILITY,
  vocabulary: LOADING_AVAILABILITY,
  pronunciation: LOADING_AVAILABILITY,
};

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

/** Observes whether each overview currently has at least one displayable item. */
export function useOverviewAvailability(userId: string | null): OverviewAvailabilityState {
  const showToast = useToastStore((state) => state.showToast);
  const levels = useUserStore((state) => state.levels);
  const levelsLoading = useUserStore((state) => state.levelsLoading);
  const levelsError = useUserStore((state) => state.levelsError);
  const [databaseState, setDatabaseState] = useState(INITIAL_DATABASE_STATE);

  useEffect(() => {
    if (!levelsError) return;
    showToast(TEXTS.loadingError, 'error');
  }, [levelsError, showToast]);

  useEffect(() => {
    if (!userId) {
      setDatabaseState(INITIAL_DATABASE_STATE);
      return;
    }

    let isActive = true;
    setDatabaseState(LOADING_DATABASE_STATE);

    const queries: ReadonlyArray<readonly [DatabaseOverviewKey, () => Promise<boolean>]> = [
      ['practice', async () => (await UserScore.getByUserId(userId)).length > 0],
      ['grammar', async () => (await GrammarGroup.getStarted(userId)).length > 0],
      ['topics', async () => (await UserBlock.getStartedTopicsByUserId(userId)).length > 0],
      ['vocabulary', async () => (await UserItem.getStartedVocabulary(userId)).length > 0],
      ['pronunciation', async () => (await PronunciationGroup.getOverview(userId)).length > 0],
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
  }, [showToast, userId]);

  return {
    ...databaseState,
    levels: {
      hasData: levels.length > 0,
      loading: levelsLoading,
      error: levelsError,
    },
  };
}
