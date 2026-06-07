import { describe, expect, it } from 'vitest';

import {
  getCompletedStarCount,
  getCurrentStarProgressCount,
  getStarProgressState,
  getStarTier,
} from '@/features/practice-overview/star-progress.utils';

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

  it('returns modulus progress count for currently started star', () => {
    expect(getCurrentStarProgressCount(0, 40)).toBe(0);
    expect(getCurrentStarProgressCount(41, 40)).toBe(1);
    expect(getCurrentStarProgressCount(80, 40)).toBe(0);
  });

  it('returns completed star count', () => {
    expect(getCompletedStarCount(0, 40)).toBe(0);
    expect(getCompletedStarCount(39, 40)).toBe(0);
    expect(getCompletedStarCount(40, 40)).toBe(1);
    expect(getCompletedStarCount(95, 40)).toBe(2);
  });
});
