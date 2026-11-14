import { act, renderHook } from '@testing-library/react';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserItemLocal } from '@/types/user-item.types';
import { NBSP } from '../hooks/use-hint';

const playAudioMock = vi.fn();
const stopAudioMock = vi.fn();
const audioStateMock = vi.hoisted(() => ({ loading: false, error: false, isAudioReady: vi.fn(() => true) }));

vi.mock('@/features/audio/use-audio-manager', () => ({
  useAudioManager: () => ({
    playAudio: playAudioMock,
    stopAudio: stopAudioMock,
    isAudioReady: audioStateMock.isAudioReady,
    isAudioLoading: () => audioStateMock.loading,
    audioError: audioStateMock.error,
    loading: audioStateMock.loading,
    isPlaying: false,
  }),
}));

import { usePracticeCardState } from '../hooks/use-practice-card-state';

const item = {
  czech: 'ahoj',
  english: 'hello',
  audio: 'hello.opus',
  pronunciation: 'hello-pron',
} as unknown as UserItemLocal;

function useTestCard(currentItem: UserItemLocal | null = item, isCompletion = false) {
  const [revealed, setRevealed] = useState(false);
  const state = usePracticeCardState({ currentItem, revealed, isCompletion, setRevealed });
  return { ...state, revealed };
}

describe('usePracticeCardState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    playAudioMock.mockResolvedValue(null);
    audioStateMock.loading = false;
    audioStateMock.error = false;
    audioStateMock.isAudioReady.mockReturnValue(true);
  });

  it('reveals the English answer and plays Czech-to-English audio', () => {
    const { result } = renderHook(() => useTestCard());

    expect(result.current.czech).toBe('ahoj');
    expect(result.current.english).not.toBe('hello');

    act(() => result.current.handleReveal());

    expect(result.current.revealed).toBe(true);
    expect(result.current.english).toBe('hello');
    expect(playAudioMock).toHaveBeenCalledOnce();
  });

  it('resets reveal and hints for the next question', () => {
    const { result } = renderHook(() => useTestCard());

    act(() => result.current.handleReveal());
    act(() => result.current.resetQuestionState());

    expect(result.current.revealed).toBe(false);
    expect(result.current.english).not.toBe('hello');
  });

  it('stops audio on completion', () => {
    const { rerender } = renderHook(
      ({ isCompletion }) => useTestCard(item, isCompletion),
      { initialProps: { isCompletion: false } },
    );

    rerender({ isCompletion: true });

    expect(stopAudioMock).toHaveBeenCalledOnce();
  });

  it('plays audio before reveal and progressively hints EN then CZ', () => {
    const enToCzItem = { ...item, item_id: 1, review_direction: 'en_to_cz' } as UserItemLocal;
    const { result } = renderHook(() => useTestCard(enToCzItem));

    expect(result.current.czech).toBe(NBSP);
    expect(result.current.english).toBe(NBSP);
    expect(result.current.pronunciation).toBe(NBSP);
    expect(playAudioMock).toHaveBeenCalledOnce();

    act(() => result.current.plusHint());
    expect(result.current.english).toBe('h');
    expect(result.current.czech).toBe(NBSP);
    expect(result.current.pronunciation).toBe(NBSP);

    act(() => {
      for (let index = 0; index < 4; index += 1) result.current.plusHint();
    });
    expect(result.current.english).toBe('hello');
    expect(result.current.czech).toBe(NBSP);

    act(() => result.current.plusHint());
    expect(result.current.czech).toBe('a');
    expect(result.current.pronunciation).toBe(NBSP);

    act(() => result.current.handleReveal());
    expect(result.current.revealed).toBe(true);
    expect(result.current.english).toBe('hello');
    expect(result.current.pronunciation).toBe('hello-pron');
    expect(result.current.czech).toBe('ahoj');
  });

  it('keeps EN-to-CZ hints available when audio is missing', () => {
    const enToCzItem = { ...item, item_id: 2, audio: null, review_direction: 'en_to_cz' } as UserItemLocal;
    const { result } = renderHook(() => useTestCard(enToCzItem));

    expect(result.current.english).toBe(NBSP);
    expect(result.current.czech).toBe(NBSP);
    expect(playAudioMock).not.toHaveBeenCalled();

    act(() => result.current.plusHint());
    expect(result.current.english).toBe('h');
    expect(result.current.czech).toBe(NBSP);
    expect(result.current.pronunciation).toBe(NBSP);

    act(() => result.current.handleReveal());
    expect(result.current.revealed).toBe(true);
    expect(result.current.english).toBe('hello');
    expect(result.current.czech).toBe('ahoj');
    expect(result.current.pronunciation).toBe('hello-pron');
  });

  it('holds the hidden audio phase until loading confirms that audio is unavailable', () => {
    const enToCzItem = { ...item, item_id: 3, review_direction: 'en_to_cz' } as UserItemLocal;
    audioStateMock.loading = true;
    const { result, rerender } = renderHook(() => useTestCard(enToCzItem));

    expect(result.current.english).toBe(NBSP);
    expect(result.current.czech).toBe(NBSP);

    audioStateMock.loading = false;
    audioStateMock.error = true;
    rerender();

    expect(result.current.english).toBe(NBSP);
    expect(result.current.czech).toBe(NBSP);
  });
});
