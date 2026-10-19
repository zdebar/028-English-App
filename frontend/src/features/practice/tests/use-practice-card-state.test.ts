import { act, renderHook } from '@testing-library/react';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserItemLocal } from '@/types/user-item.types';

const playAudioMock = vi.fn();
const stopAudioMock = vi.fn();
const audioStateMock = vi.hoisted(() => ({ loading: false, error: false }));

vi.mock('@/features/audio/use-audio-manager', () => ({
  useAudioManager: () => ({
    playAudio: playAudioMock,
    stopAudio: stopAudioMock,
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
    playAudioMock.mockResolvedValue(true);
    audioStateMock.loading = false;
    audioStateMock.error = false;
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

  it('plays audio only before reveal, then reveals the full EN-to-CZ card in one click', () => {
    const enToCzItem = { ...item, item_id: 1, review_direction: 'en_to_cz' } as UserItemLocal;
    const { result } = renderHook(() => useTestCard(enToCzItem));

    expect(result.current.czech).toBeUndefined();
    expect(result.current.english).toBeUndefined();
    expect(playAudioMock).toHaveBeenCalledOnce();

    act(() => result.current.handleReveal());
    expect(result.current.revealed).toBe(true);
    expect(result.current.english).toBe('hello');
    expect(result.current.pronunciation).toBe('hello-pron');
    expect(result.current.czech).toBe('ahoj');
  });

  it('skips the hidden audio phase when EN-to-CZ audio is missing', () => {
    const enToCzItem = { ...item, item_id: 2, audio: null, review_direction: 'en_to_cz' } as UserItemLocal;
    const { result } = renderHook(() => useTestCard(enToCzItem));

    expect(result.current.english).toBe('hello');
    expect(playAudioMock).not.toHaveBeenCalled();
    act(() => result.current.handleReveal());
    expect(result.current.revealed).toBe(true);
    expect(result.current.czech).toBe('ahoj');
  });

  it('holds the hidden audio phase until loading confirms that audio is unavailable', () => {
    const enToCzItem = { ...item, item_id: 3, review_direction: 'en_to_cz' } as UserItemLocal;
    audioStateMock.loading = true;
    const { result, rerender } = renderHook(() => useTestCard(enToCzItem));

    expect(result.current.english).toBeUndefined();
    expect(result.current.czech).toBeUndefined();

    audioStateMock.loading = false;
    audioStateMock.error = true;
    rerender();

    expect(result.current.english).toBe('hello');
    expect(result.current.czech).toBeUndefined();
  });
});
