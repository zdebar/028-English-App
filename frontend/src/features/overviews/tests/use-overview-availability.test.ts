import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  grammar: false,
  topics: [] as unknown[],
  vocabulary: [] as unknown[],
  sounds: [] as unknown[],
  grammarError: null as Error | null,
  observers: [] as Array<{
    next: (value: boolean) => void;
    error: (error: unknown) => void;
    unsubscribe: ReturnType<typeof vi.fn>;
  }>,
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

vi.mock('@/database/queries/topic-queries', () => ({
  hasInitiatedTopicsByUserId: vi.fn(async () => mocks.topics.length > 0),
}));
vi.mock('@/database/queries/grammar-queries', () => ({
  getInitiatedGrammarTopics: vi.fn(async () => []),
}));
vi.mock('@/database/models/user-items', () => ({
  default: {
    hasInitiatedGrammar: vi.fn(async () => {
      if (mocks.grammarError) throw mocks.grammarError;
      return mocks.grammar;
    }),
    hasInitiatedVocabulary: vi.fn(async () => mocks.vocabulary.length > 0),
  },
}));
vi.mock('@/database/queries/sound-queries', () => ({
  hasAvailableSoundGroups: vi.fn(async () => mocks.sounds.length > 0),
}));
import { useOverviewAvailability } from '../use-overview-availability';
import { clearSharedQueriesExcept } from '@/database/queries/shared-query-store';

describe('useOverviewAvailability', () => {
  beforeEach(() => {
    clearSharedQueriesExcept(null);
    vi.clearAllMocks();
    mocks.grammar = false;
    mocks.topics = [];
    mocks.vocabulary = [];
    mocks.sounds = [];
    mocks.grammarError = null;
    mocks.observers = [];
  });

  it('resolves all overview states independently', async () => {
    mocks.grammar = true;
    mocks.topics = [{}];

    const { result } = renderHook(() => useOverviewAvailability('u1'));

    await waitFor(() => expect(result.current.vocabulary.loading).toBe(false));
    expect(result.current.grammar.hasData).toBe(true);
    expect(result.current.topics.hasData).toBe(true);
    expect(result.current.vocabulary.hasData).toBe(false);
    expect(result.current.sounds.hasData).toBe(false);
  });

  it('releases its live queries after the page unmounts', async () => {
    const { result, unmount } = renderHook(() => useOverviewAvailability('u1'));
    await waitFor(() => expect(mocks.observers).toHaveLength(4));

    act(() => mocks.observers[0].next(true));
    expect(result.current.grammar.hasData).toBe(true);

    const unsubscribeFunctions = mocks.observers.map((observer) => observer.unsubscribe);
    unmount();
    unsubscribeFunctions.forEach((unsubscribe) => expect(unsubscribe).toHaveBeenCalledOnce());
    clearSharedQueriesExcept(null);
    unsubscribeFunctions.forEach((unsubscribe) => expect(unsubscribe).toHaveBeenCalledOnce());
  });

  it('keeps a failed overview disabled and exposes its error', async () => {
    mocks.grammarError = new Error('grammar failure');
    const { result } = renderHook(() => useOverviewAvailability('u1'));

    await waitFor(() => expect(result.current.grammar.error).toBe(mocks.grammarError));
    expect(result.current.grammar.hasData).toBe(false);
    expect(result.current.grammar.loading).toBe(false);
  });

  it('does not subscribe when there is no active user', () => {
    renderHook(() => useOverviewAvailability(null));

    expect(mocks.observers).toHaveLength(0);
  });
});
