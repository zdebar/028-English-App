import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  scores: [] as unknown[],
  grammar: [] as unknown[],
  topics: [] as unknown[],
  vocabulary: [] as unknown[],
  pronunciation: [] as unknown[],
  scoreError: null as Error | null,
  levelsState: {
    levels: [] as unknown[],
    levelsLoading: false,
    levelsError: null as Error | null,
  },
  observers: [] as Array<{
    next: (value: boolean) => void;
    error: (error: unknown) => void;
    unsubscribe: ReturnType<typeof vi.fn>;
  }>,
  reportError: vi.fn(),
  showToast: vi.fn(),
}));

vi.mock('dexie', () => ({
  liveQuery: (query: () => Promise<boolean>) => ({
    subscribe: (observer: { next: (value: boolean) => void; error: (error: unknown) => void }) => {
      const unsubscribe = vi.fn();
      mocks.observers.push({ ...observer, unsubscribe });
      void query().then(observer.next, observer.error);
      return { unsubscribe };
    },
  }),
}));

vi.mock('@/database/models/user-scores', () => ({
  default: {
    getByUserId: vi.fn(async () => {
      if (mocks.scoreError) throw mocks.scoreError;
      return mocks.scores;
    }),
  },
}));
vi.mock('@/database/models/grammar-groups', () => ({
  default: { getStarted: vi.fn(async () => mocks.grammar) },
}));
vi.mock('@/database/models/user-blocks', () => ({
  default: { getStartedTopicsByUserId: vi.fn(async () => mocks.topics) },
}));
vi.mock('@/database/models/user-items', () => ({
  default: { getStartedVocabulary: vi.fn(async () => mocks.vocabulary) },
}));
vi.mock('@/database/models/pronunciation-groups', () => ({
  default: { getOverview: vi.fn(async () => mocks.pronunciation) },
}));

vi.mock('@/features/user-stats/use-user-store', () => ({
  useUserStore: (selector: (state: typeof mocks.levelsState) => unknown) =>
    selector(mocks.levelsState),
}));
vi.mock('@/features/toast/use-toast-store', () => ({
  useToastStore: (selector: (state: { showToast: typeof mocks.showToast }) => unknown) =>
    selector({ showToast: mocks.showToast }),
}));
vi.mock('@/features/logging/monitoring-handler', () => ({
  reportError: (...args: unknown[]) => mocks.reportError(...args),
}));
vi.mock('@/locales/cs', () => ({
  TEXTS: { loadingError: 'Loading error' },
}));

import { useOverviewAvailability } from '../use-overview-availability';

describe('useOverviewAvailability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.scores = [];
    mocks.grammar = [];
    mocks.topics = [];
    mocks.vocabulary = [];
    mocks.pronunciation = [];
    mocks.scoreError = null;
    mocks.levelsState = { levels: [], levelsLoading: false, levelsError: null };
    mocks.observers = [];
  });

  it('resolves all six overview states independently', async () => {
    mocks.scores = [{}];
    mocks.topics = [{}];
    mocks.pronunciation = [{}];
    mocks.levelsState.levels = [{}];

    const { result } = renderHook(() => useOverviewAvailability('u1'));

    await waitFor(() => expect(result.current.pronunciation.loading).toBe(false));
    expect(result.current.practice.hasData).toBe(true);
    expect(result.current.levels.hasData).toBe(true);
    expect(result.current.grammar.hasData).toBe(false);
    expect(result.current.topics.hasData).toBe(true);
    expect(result.current.vocabulary.hasData).toBe(false);
    expect(result.current.pronunciation.hasData).toBe(true);
  });

  it('reacts to database emissions and unsubscribes every observer', async () => {
    const { result, unmount } = renderHook(() => useOverviewAvailability('u1'));
    await waitFor(() => expect(mocks.observers).toHaveLength(5));

    act(() => mocks.observers[0].next(true));
    expect(result.current.practice.hasData).toBe(true);

    const unsubscribeFunctions = mocks.observers.map((observer) => observer.unsubscribe);
    unmount();
    unsubscribeFunctions.forEach((unsubscribe) => expect(unsubscribe).toHaveBeenCalledOnce());
  });

  it('keeps a failed overview disabled and reports the loading error', async () => {
    mocks.scoreError = new Error('score failure');
    const { result } = renderHook(() => useOverviewAvailability('u1'));

    await waitFor(() => expect(result.current.practice.error).toBe(mocks.scoreError));
    expect(result.current.practice.hasData).toBe(false);
    expect(mocks.reportError).toHaveBeenCalledWith(
      'Failed to observe practice overview availability',
      mocks.scoreError,
    );
    expect(mocks.showToast).toHaveBeenCalledWith('Loading error', 'error');
  });

  it('uses the existing levels loading and error state', () => {
    const levelsError = new Error('levels failure');
    mocks.levelsState = { levels: [], levelsLoading: false, levelsError };

    const { result } = renderHook(() => useOverviewAvailability(null));

    expect(result.current.levels).toEqual({
      hasData: false,
      loading: false,
      error: levelsError,
    });
    expect(mocks.showToast).toHaveBeenCalledWith('Loading error', 'error');
    expect(mocks.observers).toHaveLength(0);
  });
});
