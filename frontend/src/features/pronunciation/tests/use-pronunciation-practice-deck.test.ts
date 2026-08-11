import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { UserItemLocal } from '@/types/user-item.types';

const mocks = vi.hoisted(() => ({
  loadPronunciationPracticeDeck: vi.fn(),
  playAudio: vi.fn(),
}));

const items = [
  { item_id: 1, english: 'man', audio: 'man.opus' },
  { item_id: 2, english: 'men', audio: 'men.opus' },
] as UserItemLocal[];
const entries = items.map((item) => ({ item, note: null, grammar: null }));

vi.mock('@/database/utils/practice-content.utils', () => ({
  loadPronunciationPracticeDeck: mocks.loadPronunciationPracticeDeck,
}));

vi.mock('@/config/config', () => ({
  default: {
    practice: { audioDelay: 300 },
  },
}));

vi.mock('@/features/audio/use-audio-manager', () => ({
  useAudioManager: () => ({
    playAudio: mocks.playAudio,
    audioError: false,
    loading: false,
  }),
}));

import { usePronunciationPracticeDeck } from '../use-pronunciation-practice-deck';

describe('usePronunciationPracticeDeck', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    mocks.loadPronunciationPracticeDeck.mockResolvedValue(entries);
  });

  it('loops back to a freshly loaded first item after the last one', async () => {
    const { result } = renderHook(() => usePronunciationPracticeDeck('u1'));

    await waitFor(() => expect(result.current.currentItem?.english).toBe('man'));
    expect(mocks.loadPronunciationPracticeDeck).toHaveBeenCalledTimes(1);

    await act(() => result.current.next());

    expect(result.current.currentItem?.english).toBe('men');
    expect(result.current.progressLabel).toBe('2 / 2');
    expect(mocks.loadPronunciationPracticeDeck).toHaveBeenCalledTimes(1);

    await act(() => result.current.next());

    expect(result.current.currentItem?.english).toBe('man');
    expect(result.current.progressLabel).toBe('1 / 2');
    expect(mocks.loadPronunciationPracticeDeck).toHaveBeenCalledWith('u1');
    expect(mocks.loadPronunciationPracticeDeck).toHaveBeenCalledTimes(2);
  });

  it('removes an item switched off during practice from the next round', async () => {
    mocks.loadPronunciationPracticeDeck
      .mockResolvedValueOnce(entries)
      .mockResolvedValue([entries[1]]);
    const { result } = renderHook(() => usePronunciationPracticeDeck('u1'));

    await waitFor(() => expect(result.current.currentItem?.english).toBe('man'));

    await act(() => result.current.next());

    expect(result.current.currentItem?.english).toBe('men');
    expect(result.current.progressLabel).toBe('2 / 2');

    await act(() => result.current.next());

    expect(result.current.currentItem?.english).toBe('men');
    expect(result.current.progressLabel).toBe('1 / 1');
  });

  it('disables advancing and does not reload a one-item deck', async () => {
    mocks.loadPronunciationPracticeDeck.mockResolvedValue([entries[0]]);
    const { result } = renderHook(() => usePronunciationPracticeDeck('u1'));

    await waitFor(() => expect(result.current.currentItem?.english).toBe('man'));
    expect(result.current.canGoNext).toBe(false);

    await act(() => result.current.next());

    expect(mocks.loadPronunciationPracticeDeck).toHaveBeenCalledTimes(1);
    expect(result.current.currentItem?.english).toBe('man');
  });

  it('reloads from index zero after removal and reaches empty state for the last item', async () => {
    mocks.loadPronunciationPracticeDeck.mockResolvedValueOnce([entries[0]]).mockResolvedValue([]);
    const { result } = renderHook(() => usePronunciationPracticeDeck('u1'));

    await waitFor(() => expect(result.current.currentItem?.english).toBe('man'));

    act(() => result.current.handleSelectionChange(false));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mocks.loadPronunciationPracticeDeck).toHaveBeenCalledTimes(2);
    expect(result.current.currentItem).toBeNull();
    expect(result.current.progressLabel).toBe('0 / 0');
  });

  it('publishes the first item in the same render that finishes loading', async () => {
    let resolveDeck: (items: typeof entries) => void = () => undefined;
    mocks.loadPronunciationPracticeDeck.mockReturnValue(
      new Promise<typeof entries>((resolve) => {
        resolveDeck = resolve;
      }),
    );
    const renders: Array<{ loading: boolean; hasCurrentItem: boolean }> = [];

    const { result } = renderHook(() => {
      const deck = usePronunciationPracticeDeck('u1');
      renders.push({ loading: deck.loading, hasCurrentItem: Boolean(deck.currentItem) });
      return deck;
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.currentItem).toBeNull();

    await act(async () => {
      resolveDeck(entries);
      await Promise.resolve();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.currentItem?.english).toBe('man');
    expect(renders).not.toContainEqual({ loading: false, hasCurrentItem: false });
  });

  it('plays the current item after the configured audio delay', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => usePronunciationPracticeDeck('u1'));

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(result.current.currentItem?.english).toBe('man');

    act(() => vi.advanceTimersByTime(299));
    expect(mocks.playAudio).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));
    expect(mocks.playAudio).toHaveBeenCalledTimes(1);
  });
});
