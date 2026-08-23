import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/config/config', () => ({
  default: {
    practice: {
      reviewStarSize: 20,
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

  it('uses completed stars directly and displays local session progress', () => {
    const { result } = renderHook(() => usePracticeStars(5, 7));

    expect(result.current.starCount).toBe(5);
    expect(result.current.displayedChunkCount).toBe(7);
    expect(result.current.starChunk).toBe(20);
  });

  it('does not derive stars by dividing answer counts', () => {
    const { result, rerender } = renderHook(({ starCount }) => usePracticeStars(starCount, 0), {
      initialProps: { starCount: 1 },
    });

    rerender({ starCount: 2 });

    expect(result.current.starCount).toBe(2);
    expect(result.current.displayedChunkCount).toBe(0);
  });
});
