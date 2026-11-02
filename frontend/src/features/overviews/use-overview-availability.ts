import { useDataManager } from '@/database/state/data-store';
import {
  selectGrammarOverview,
  selectSoundOverview,
  selectTopicOverview,
  selectVocabulary,
} from '@/database/state/data-selectors';

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

const INITIAL_AVAILABILITY: OverviewAvailabilityState = {
  grammar: EMPTY_AVAILABILITY,
  topics: EMPTY_AVAILABILITY,
  vocabulary: EMPTY_AVAILABILITY,
  sounds: EMPTY_AVAILABILITY,
};

/** Selects every overview's availability from the central IndexedDB mirror. */
export function useOverviewAvailability(userId: string | null): OverviewAvailabilityState {
  const state = useDataManager((current) => current);
  if (!userId) return INITIAL_AVAILABILITY;
  if (state.userId !== userId || state.status === 'loading' || state.status === 'idle') {
    return {
      grammar: LOADING_AVAILABILITY,
      topics: LOADING_AVAILABILITY,
      vocabulary: LOADING_AVAILABILITY,
      sounds: LOADING_AVAILABILITY,
    };
  }
  if (state.status === 'error') {
    return {
      grammar: { ...EMPTY_AVAILABILITY, error: state.error },
      topics: { ...EMPTY_AVAILABILITY, error: state.error },
      vocabulary: { ...EMPTY_AVAILABILITY, error: state.error },
      sounds: { ...EMPTY_AVAILABILITY, error: state.error },
    };
  }

  return {
    grammar: { hasData: selectGrammarOverview(state, userId).length > 0, loading: false, error: null },
    topics: { hasData: selectTopicOverview(state, userId).length > 0, loading: false, error: null },
    vocabulary: { hasData: selectVocabulary(state, userId).length > 0, loading: false, error: null },
    sounds: {
      hasData: selectSoundOverview(state, userId).some((sound) => sound.isActive),
      loading: false,
      error: null,
    },
  };
}
