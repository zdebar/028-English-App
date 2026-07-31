import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { UserItemLocal } from '@/types/user-item.types';

const mocks = vi.hoisted(() => ({
  getPronunciationPracticeDeck: vi.fn(),
  playAudio: vi.fn(),
}));

const items = [
  { item_id: 1, english: 'man', audio: 'man.opus' },
  { item_id: 2, english: 'men', audio: 'men.opus' },
] as UserItemLocal[];

vi.mock('@/database/models/user-items', () => ({
  default: {
    getPronunciationPracticeDeck: mocks.getPronunciationPracticeDeck,
  },
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
    mocks.getPronunciationPracticeDeck.mockResolvedValue(items);
  });

  it('loops back to a freshly loaded first item after the last one', async () => {
    const { result } = renderHook(() => usePronunciationPracticeDeck('u1'));

    await waitFor(() => expect(result.current.currentItem?.english).toBe('man'));
    expect(mocks.getPronunciationPracticeDeck).toHaveBeenCalledTimes(1);

    await act(() => result.current.next());

    expect(result.current.currentItem?.english).toBe('men');
    expect(result.current.progressLabel).toBe('2 / 2');
    expect(mocks.getPronunciationPracticeDeck).toHaveBeenCalledTimes(1);

    await act(() => result.current.next());

    expect(result.current.currentItem?.english).toBe('man');
    expect(result.current.progressLabel).toBe('1 / 2');
    expect(mocks.getPronunciationPracticeDeck).toHaveBeenCalledWith('u1');
    expect(mocks.getPronunciationPracticeDeck).toHaveBeenCalledTimes(2);
  });

  it('removes an item switched off during practice from the next round', async () => {
    mocks.getPronunciationPracticeDeck.mockResolvedValueOnce(items).mockResolvedValue([items[1]]);
    const { result } = renderHook(() => usePronunciationPracticeDeck('u1'));

    await waitFor(() => expect(result.current.currentItem?.english).toBe('man'));

    await act(() => result.current.next());

    expect(result.current.currentItem?.english).toBe('men');
    expect(result.current.progressLabel).toBe('2 / 2');

    await act(() => result.current.next());

    expect(result.current.currentItem?.english).toBe('men');
    expect(result.current.progressLabel).toBe('1 / 1');
  });

  it('publishes the first item in the same render that finishes loading', async () => {
    let resolveDeck: (items: UserItemLocal[]) => void = () => undefined;
    mocks.getPronunciationPracticeDeck.mockReturnValue(
      new Promise<UserItemLocal[]>((resolve) => {
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
      resolveDeck(items);
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
