import { act, renderHook } from '@testing-library/react';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { UserItemLocal } from '@/types/user-item.types';

const playAudioMock = vi.fn();

vi.mock('@/config/config', () => ({
  default: {
    practice: { audioDelay: 300 },
  },
}));

vi.mock('@/features/audio/use-audio-manager', () => ({
  useAudioManager: () => ({
    playAudio: playAudioMock,
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
  curriculum_sort_path: [1, 1, 1, 1],
} as unknown as UserItemLocal;

function useTestCard(isCzToEn: boolean, currentItem: UserItemLocal | null = item) {
  const [revealed, setRevealed] = useState(false);
  const state = usePracticeCardState({ currentItem, isCzToEn, revealed, setRevealed });
  return { ...state, revealed };
}

describe('usePracticeCardState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('requires direction confirmation before revealing and playing audio', () => {
    const { result } = renderHook(() => useTestCard(true));

    expect(result.current.showDirectionChange).toBe(true);

    act(() => result.current.handleReveal());
    expect(result.current.showDirectionChange).toBe(false);
    expect(result.current.revealed).toBe(false);

    act(() => result.current.handleReveal());
    expect(result.current.revealed).toBe(true);
    expect(playAudioMock).toHaveBeenCalledTimes(1);
  });

  it('plays delayed audio after confirming reverse direction', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useTestCard(false));

    act(() => result.current.handleReveal());
    expect(playAudioMock).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(299));
    expect(playAudioMock).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));
    expect(playAudioMock).toHaveBeenCalledTimes(1);
  });

  it('resets reveal and hints for the next question', () => {
    const { result } = renderHook(() => useTestCard(true));

    act(() => result.current.handleReveal());
    act(() => result.current.handleReveal());
    expect(result.current.revealed).toBe(true);

    act(() => result.current.resetQuestionState());
    expect(result.current.revealed).toBe(false);
    expect(result.current.english).toBe('\u00A0');
  });

  it('marks a card without audio as audio-disabled', () => {
    const { result } = renderHook(() => useTestCard(true, { ...item, audio: null }));

    act(() => result.current.handleReveal());
    act(() => result.current.handleReveal());

    expect(result.current.audioDisabled).toBe(true);
  });
});
