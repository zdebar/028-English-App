import { describe, expect, it } from 'vitest';

import { getStarProgressState, getStarTier } from '@/utils/star-progress.utils';

describe('star-progress.utils', () => {
  it('returns bronze as the initial tier and partial active progress', () => {
    expect(getStarProgressState(10, 50, 10)).toEqual(
      expect.objectContaining({
        completedStars: 0,
        completedTiers: 0,
        activeRowCompletedStars: 0,
        activeStarProgress: 0.2,
        currentChunkCount: 10,
        activeTier: 'bronze',
      }),
    );
  });

  it('moves to silver after one full bronze row', () => {
    expect(getStarProgressState(500, 50, 10)).toEqual(
      expect.objectContaining({
        completedStars: 10,
        completedTiers: 1,
        activeRowCompletedStars: 0,
        activeStarProgress: 0,
        currentChunkCount: 0,
        activeTier: 'silver',
      }),
    );
  });

  it('repeats gold for tiers above silver', () => {
    expect(getStarTier(2)).toBe('gold');
    expect(getStarTier(5)).toBe('gold');
  });
});
