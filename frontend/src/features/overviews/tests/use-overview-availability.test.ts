import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  state: { userId: 'u1' as string | null, status: 'ready' as string, error: null as Error | null },
  grammar: [] as unknown[],
  topics: [] as unknown[],
  vocabulary: [] as unknown[],
  sounds: [] as Array<{ isActive: boolean }>,
}));

vi.mock('@/database/state/data-store', () => ({
  useDataPackage: () => ({
    userId: mocks.state.userId,
    status: mocks.state.status,
    error: mocks.state.error,
    data: {
      grammar: mocks.grammar.length > 0,
      topics: mocks.topics.length > 0,
      vocabulary: mocks.vocabulary.length > 0,
      sounds: mocks.sounds.some((sound) => sound.isActive),
    },
  }),
}));

import { useOverviewAvailability } from '../use-overview-availability';

describe('useOverviewAvailability', () => {
  beforeEach(() => {
    mocks.state = { userId: 'u1', status: 'ready', error: null };
    mocks.grammar = [];
    mocks.topics = [];
    mocks.vocabulary = [];
    mocks.sounds = [];
  });

  it('selects all overview availability from the shared snapshot', () => {
    mocks.grammar = [{ id: 1 }];
    mocks.topics = [{ id: 2 }];
    mocks.vocabulary = [{ item_id: 3 }];
    mocks.sounds = [{ isActive: false }, { isActive: true }];

    const { result } = renderHook(() => useOverviewAvailability('u1'));

    expect(result.current).toEqual({
      grammar: { hasData: true, loading: false, error: null },
      topics: { hasData: true, loading: false, error: null },
      vocabulary: { hasData: true, loading: false, error: null },
      sounds: { hasData: true, loading: false, error: null },
    });
  });

  it('reports loading while the active account snapshot is being loaded', () => {
    mocks.state.status = 'loading';

    const { result } = renderHook(() => useOverviewAvailability('u1'));

    expect(result.current.grammar.loading).toBe(true);
    expect(result.current.topics.loading).toBe(true);
  });

  it('exposes a bootstrap error for each overview', () => {
    const error = new Error('data bootstrap failed');
    mocks.state.error = error;
    mocks.state.status = 'error';

    const { result } = renderHook(() => useOverviewAvailability('u1'));

    expect(result.current.grammar).toEqual({ hasData: false, loading: false, error });
    expect(result.current.sounds).toEqual({ hasData: false, loading: false, error });
  });

  it('returns the empty state when signed out without subscribing to database changes', () => {
    const { result } = renderHook(() => useOverviewAvailability(null));

    expect(result.current.grammar).toEqual({ hasData: false, loading: false, error: null });
    expect(result.current.topics).toEqual({ hasData: false, loading: false, error: null });
  });
});
