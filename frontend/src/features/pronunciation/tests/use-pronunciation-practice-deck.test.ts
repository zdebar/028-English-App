import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { UserItemLocal } from '@/types/user-item.types';

const mocks = vi.hoisted(() => ({
  hideDirectionChange: vi.fn(),
  resetHint: vi.fn(),
}));

const items = [
  { item_id: 1, english: 'man' },
  { item_id: 2, english: 'men' },
] as UserItemLocal[];

vi.mock('@/database/models/user-items', () => ({
  default: {
    getPronunciationPracticeDeck: vi.fn(async () => items),
  },
}));

vi.mock('@/hooks/use-fetch', () => ({
  useFetch: () => ({ data: items, loading: false, error: null }),
}));

vi.mock('@/features/practice/hooks/use-practice-card-state', () => ({
  usePracticeCardState: ({
    currentItem,
    revealed,
  }: {
    currentItem: UserItemLocal | null;
    revealed: boolean;
  }) => ({
    audioDisabled: false,
    audioError: false,
    audioLoading: false,
    czech: currentItem?.czech,
    english: currentItem?.english,
    handleReveal: vi.fn(),
    hideDirectionChange: mocks.hideDirectionChange,
    playAudio: vi.fn(),
    plusHint: vi.fn(),
    pronunciation: currentItem?.pronunciation,
    resetHint: mocks.resetHint,
    revealed,
    showDirectionChange: false,
  }),
}));

import { usePronunciationPracticeDeck } from '../use-pronunciation-practice-deck';

describe('usePronunciationPracticeDeck', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts revealed and loops back to the first item after the last one', async () => {
    const { result } = renderHook(() => usePronunciationPracticeDeck('u1'));

    await waitFor(() => expect(result.current.currentItem?.english).toBe('man'));
    expect(result.current.revealed).toBe(true);
    expect(mocks.hideDirectionChange).toHaveBeenCalled();

    act(() => result.current.next());

    expect(result.current.currentItem?.english).toBe('men');
    expect(result.current.revealed).toBe(true);
    expect(result.current.progressLabel).toBe('2 / 2');

    act(() => result.current.next());

    expect(result.current.currentItem?.english).toBe('man');
    expect(result.current.revealed).toBe(true);
    expect(result.current.progressLabel).toBe('1 / 2');
  });
});
