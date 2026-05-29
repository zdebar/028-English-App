import { renderHook } from '@testing-library/react';
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
  });

  it('returns normal partial progress within the current star chunk', () => {
    const { result } = renderHook(() => usePracticeStars(5));

    expect(result.current.starCount).toBe(0);
    expect(result.current.displayedChunkCount).toBe(5);
  });

  it('wraps to 0 progress immediately when a star chunk is completed', () => {
    const { result, rerender } = renderHook(({ dailyCount }) => usePracticeStars(dailyCount), {
      initialProps: { dailyCount: 49 },
    });

    rerender({ dailyCount: 50 });

    expect(result.current.starCount).toBe(1);
    expect(result.current.displayedChunkCount).toBe(0);
  });
});
