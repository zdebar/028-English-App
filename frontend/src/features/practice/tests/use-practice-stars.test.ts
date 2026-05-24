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

import { usePracticeStars } from '../hooks/use-practice-stars';

describe('usePracticeStars', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it('returns normal partial progress within the current star chunk', () => {
    const { result } = renderHook(() => usePracticeStars(5));

    expect(result.current.starCount).toBe(0);
    expect(result.current.displayedChunkCount).toBe(5);
    expect(result.current.completedStarFlash).toBeNull();
  });

  it('keeps 50/50 text during flash while a new star has just completed', () => {
    const { result, rerender } = renderHook(({ dailyCount }) => usePracticeStars(dailyCount), {
      initialProps: { dailyCount: 49 },
    });

    rerender({ dailyCount: 50 });

    expect(result.current.starCount).toBe(1);
    expect(result.current.completedStarFlash).toBe('bronze');
    expect(result.current.displayedChunkCount).toBe(50);
  });

  it('clears flash after delay and then shows 0/50 on the next active star', () => {
    const { result, rerender } = renderHook(({ dailyCount }) => usePracticeStars(dailyCount), {
      initialProps: { dailyCount: 49 },
    });

    rerender({ dailyCount: 50 });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.completedStarFlash).toBeNull();
    expect(result.current.displayedChunkCount).toBe(0);
  });
});
