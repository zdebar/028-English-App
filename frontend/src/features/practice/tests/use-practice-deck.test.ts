import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { UserItemPractice } from '@/types/local.types';

const useFetchMock = vi.fn();
const getPracticeDeckMock = vi.fn();
const savePracticeDeckMock = vi.fn();
const resetHintMock = vi.fn();
const plusHintMock = vi.fn();
const playAudioMock = vi.fn();
const setVolumeMock = vi.fn();
const reloadMock = vi.fn();

vi.mock('@/hooks/use-fetch', () => ({
  useFetch: (...args: unknown[]) => useFetchMock(...args),
}));

vi.mock('@/database/models/user-items', () => ({
  default: {
    getPracticeDeck: (...args: unknown[]) => getPracticeDeckMock(...args),
    savePracticeDeck: (...args: unknown[]) => savePracticeDeckMock(...args),
  },
}));

vi.mock('./use-hint', () => ({
  useHint: () => ({
    czechHinted: 'CZ_HINT',
    englishHinted: 'EN_HINT',
    resetHint: resetHintMock,
    plusHint: plusHintMock,
  }),
}));

vi.mock('./use-audio-manager', () => ({
  useAudioManager: () => ({
    playAudio: playAudioMock,
    setVolume: setVolumeMock,
    audioError: false,
    loading: false,
    isPlaying: false,
  }),
}));

vi.mock('../logging/error-handler', () => ({
  errorHandler: vi.fn(),
}));

vi.mock('../logging/info-handler', () => ({
  infoHandler: vi.fn(),
}));

import { usePracticeDeck } from '../hooks/use-practice-deck';

function makeItem(overrides: Partial<UserItemPractice> = {}): UserItemPractice {
  return {
    item_id: 1,
    user_id: 'u1',
    czech: 'ahoj',
    english: 'hello',
    pronunciation: 'həˈloʊ',
    audio: 'hello.opus',
    item_sort_order: 1,
    grammar_id: 10,
    progress: 0,
    started_at: '2026-01-01',
    updated_at: '2026-01-01',
    deleted_at: null,
    next_at: '2026-01-01',
    mastered_at: '2026-01-01',
    show_new_grammar_indicator: false,
    ...overrides,
  };
}

describe('usePracticeDeck', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useFetchMock.mockReturnValue({
      data: [makeItem({ item_id: 1, progress: 0 }), makeItem({ item_id: 2, progress: 1 })],
      error: null,
      reload: reloadMock,
    });

    getPracticeDeckMock.mockResolvedValue([]);
    savePracticeDeckMock.mockResolvedValue(undefined);
  });

  it('maps fetched data into deck state and exposes derived values', async () => {
    const { result } = renderHook(() => usePracticeDeck('user-1'));

    await waitFor(() => expect(result.current.currentItem?.item_id).toBe(1));

    expect(result.current.index).toBe(0);
    expect(result.current.isCzToEn).toBe(true);
    expect(result.current.czech).toBe('ahoj');
    expect(result.current.english).toBe('EN_HINT');
    expect(result.current.audioDisabled).toBe(true);
    expect(result.current.grammar_id).toBe(10);
    expect(result.current.showNewGrammarIndicator).toBe(false);
    expect(resetHintMock).toHaveBeenCalled();
  });

  it('nextItem advances through the deck and resets reveal/hints', async () => {
    const { result } = renderHook(() => usePracticeDeck('user-1'));

    await waitFor(() => expect(result.current.currentItem?.item_id).toBe(1));

    act(() => {
      result.current.setRevealed(true);
    });

    await act(async () => {
      await result.current.nextItem(2);
    });

    expect(result.current.index).toBe(1);
    expect(result.current.currentItem?.item_id).toBe(2);
    expect(result.current.revealed).toBe(false);
    expect(resetHintMock).toHaveBeenCalled();
    expect(savePracticeDeckMock).not.toHaveBeenCalled();
  });

  it('saves and reloads when progress count reaches deck length', async () => {
    const { result } = renderHook(() => usePracticeDeck('user-1'));

    await waitFor(() => expect(result.current.currentItem?.item_id).toBe(1));

    await act(async () => {
      await result.current.nextItem(1);
    });

    await act(async () => {
      await result.current.nextItem(1);
    });

    await waitFor(() => expect(savePracticeDeckMock).toHaveBeenCalledTimes(1));
    expect(savePracticeDeckMock).toHaveBeenCalledWith(
      'user-1',
      expect.arrayContaining([
        expect.objectContaining({ item_id: 1, progress: 1 }),
        expect.objectContaining({ item_id: 2, progress: 2 }),
      ]),
    );
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });

  it('stores progress to localStorage on beforeunload and saves remaining on unmount', async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    const { result, unmount } = renderHook(() => usePracticeDeck('user-1'));
    await waitFor(() => expect(result.current.currentItem?.item_id).toBe(1));

    await act(async () => {
      await result.current.nextItem(3);
    });

    act(() => {
      window.dispatchEvent(new Event('beforeunload'));
    });

    expect(setItemSpy).toHaveBeenCalledWith(
      'practiceDeckProgress_user-1',
      expect.stringContaining('"item_id":1'),
    );

    unmount();

    await waitFor(() => expect(savePracticeDeckMock).toHaveBeenCalledTimes(1));

    setItemSpy.mockRestore();
  });
});
