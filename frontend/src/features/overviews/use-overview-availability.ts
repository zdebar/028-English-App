import { useDataPackage } from '@/database/state/data-store';

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
  const result = useDataPackage({ kind: 'overview-menu' });
  if (!userId) return INITIAL_AVAILABILITY;
  if (result.userId !== userId || result.status === 'loading') {
    return {
      grammar: LOADING_AVAILABILITY,
      topics: LOADING_AVAILABILITY,
      vocabulary: LOADING_AVAILABILITY,
      sounds: LOADING_AVAILABILITY,
    };
  }
  if (result.status === 'error') {
    return {
      grammar: { ...EMPTY_AVAILABILITY, error: result.error },
      topics: { ...EMPTY_AVAILABILITY, error: result.error },
      vocabulary: { ...EMPTY_AVAILABILITY, error: result.error },
      sounds: { ...EMPTY_AVAILABILITY, error: result.error },
    };
  }

  const availability = result.data;
  if (!availability) return INITIAL_AVAILABILITY;
  return {
    grammar: { hasData: availability.grammar, loading: false, error: null },
    topics: { hasData: availability.topics, loading: false, error: null },
    vocabulary: { hasData: availability.vocabulary, loading: false, error: null },
    sounds: { hasData: availability.sounds, loading: false, error: null },
  };
}
