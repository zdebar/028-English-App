import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  grammar: false,
  topics: [] as unknown[],
  vocabulary: [] as unknown[],
  grammarError: null as Error | null,
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

vi.mock('@/database/models/user-blocks', () => ({
  default: { getStartedTopicsByUserId: vi.fn(async () => mocks.topics) },
}));
vi.mock('@/database/models/user-items', () => ({
  default: {
    hasStartedGrammar: vi.fn(async () => {
      if (mocks.grammarError) throw mocks.grammarError;
      return mocks.grammar;
    }),
    getStartedVocabulary: vi.fn(async () => mocks.vocabulary),
  },
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
    mocks.grammar = false;
    mocks.topics = [];
    mocks.vocabulary = [];
    mocks.grammarError = null;
    mocks.observers = [];
  });

  it('resolves all three overview states independently', async () => {
    mocks.grammar = true;
    mocks.topics = [{}];

    const { result } = renderHook(() => useOverviewAvailability('u1'));

    await waitFor(() => expect(result.current.vocabulary.loading).toBe(false));
    expect(result.current.grammar.hasData).toBe(true);
    expect(result.current.topics.hasData).toBe(true);
    expect(result.current.vocabulary.hasData).toBe(false);
  });

  it('reacts to database emissions and unsubscribes every observer', async () => {
    const { result, unmount } = renderHook(() => useOverviewAvailability('u1'));
    await waitFor(() => expect(mocks.observers).toHaveLength(3));

    act(() => mocks.observers[0].next(true));
    expect(result.current.grammar.hasData).toBe(true);

    const unsubscribeFunctions = mocks.observers.map((observer) => observer.unsubscribe);
    unmount();
    unsubscribeFunctions.forEach((unsubscribe) => expect(unsubscribe).toHaveBeenCalledOnce());
  });

  it('keeps a failed overview disabled and reports the loading error', async () => {
    mocks.grammarError = new Error('grammar failure');
    const { result } = renderHook(() => useOverviewAvailability('u1'));

    await waitFor(() => expect(result.current.grammar.error).toBe(mocks.grammarError));
    expect(result.current.grammar.hasData).toBe(false);
    expect(mocks.reportError).toHaveBeenCalledWith(
      'Failed to observe grammar overview availability',
      mocks.grammarError,
    );
    expect(mocks.showToast).toHaveBeenCalledWith('Loading error', 'error');
  });

  it('does not subscribe when there is no active user', () => {
    renderHook(() => useOverviewAvailability(null));

    expect(mocks.observers).toHaveLength(0);
  });
});
