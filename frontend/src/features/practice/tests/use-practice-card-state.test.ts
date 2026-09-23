import { act, renderHook } from '@testing-library/react';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserItemLocal } from '@/types/user-item.types';

const playAudioMock = vi.fn();
const stopAudioMock = vi.fn();

vi.mock('@/features/audio/use-audio-manager', () => ({
  useAudioManager: () => ({
    playAudio: playAudioMock,
    stopAudio: stopAudioMock,
    audioError: false,
    loading: false,
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
  beforeEach(() => vi.clearAllMocks());

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
});
