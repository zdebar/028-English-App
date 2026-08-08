import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  words: [] as Array<{ item_id: number; english: string; czech: string }>,
}));

vi.mock('@/hooks/use-live-query-data', () => ({
  useLiveQueryData: () => ({ data: mocks.words, loading: false, error: null }),
}));

vi.mock('@/database/models/user-items', () => ({
  default: { getStartedVocabulary: vi.fn() },
}));

import { useVocabulary } from '../use-vocabulary';

describe('useVocabulary live selection', () => {
  beforeEach(() => {
    localStorage.clear();
    mocks.words = [];
  });

  it('keeps a selected word by item id and closes it after removal', () => {
    mocks.words = [{ item_id: 1, english: 'house', czech: 'dům' }];
    const { result, rerender } = renderHook(() => useVocabulary('u1'));

    act(() => result.current.setSelectedWord(mocks.words[0] as any));
    expect(result.current.selectedWord?.english).toBe('house');

    mocks.words = [{ item_id: 1, english: 'home', czech: 'domov' }];
    rerender();
    expect(result.current.selectedWord?.english).toBe('home');

    mocks.words = [];
    rerender();
    expect(result.current.selectedWord).toBeNull();

    mocks.words = [{ item_id: 1, english: 'returned', czech: 'vrácený' }];
    rerender();
    expect(result.current.selectedWord).toBeNull();
  });
});
