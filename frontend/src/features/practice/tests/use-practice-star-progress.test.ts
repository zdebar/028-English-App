import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/config/config', () => ({
  default: {
    practice: {
      starChunk: 50,
      starsPerRow: 10,
      starFlashDuration: 300,
    },
  },
}));

import { usePracticeStarProgress } from '../hooks/use-practice-star-progress';

describe('usePracticeStarProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it('returns normal partial progress within the current star chunk', () => {
    const { result } = renderHook(() => usePracticeStarProgress(5));

    expect(result.current.displayedChunkCount).toBe(5);
    expect(result.current.displayedStarProgress).toBe(0.1);
    expect(result.current.completedStarFlash).toBeNull();
  });

  it('keeps 50/50 text during flash while the new active star is already empty', () => {
    const { result, rerender } = renderHook(
      ({ dailyCount }) => usePracticeStarProgress(dailyCount),
      { initialProps: { dailyCount: 49 } },
    );

    rerender({ dailyCount: 50 });

    expect(result.current.completedStarFlash).toBe('bronze');
    expect(result.current.displayedChunkCount).toBe(50);
    expect(result.current.displayedStarProgress).toBe(0);
    expect(result.current.starProgress.activeTier).toBe('bronze');
  });

  it('clears flash after the configured delay and then shows 0/50 text', () => {
    const { result, rerender } = renderHook(
      ({ dailyCount }) => usePracticeStarProgress(dailyCount),
      { initialProps: { dailyCount: 49 } },
    );

    rerender({ dailyCount: 50 });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.completedStarFlash).toBeNull();
    expect(result.current.displayedChunkCount).toBe(0);
    expect(result.current.displayedStarProgress).toBe(0);
  });
});
