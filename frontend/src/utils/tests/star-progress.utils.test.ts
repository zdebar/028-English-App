import { describe, expect, it } from 'vitest';

import {
  getCompletedStarCount,
  getStarTier,
  getStarTierForCount,
} from '@/utils/star-progress.utils';

describe('star-progress.utils', () => {
  it('repeats gold for tiers above silver', () => {
    expect(getStarTier(2)).toBe('gold');
    expect(getStarTier(5)).toBe('gold');
  });

  it('returns the tier for the exact one-based earned star', () => {
    expect(getStarTierForCount(1, 10)).toBe('bronze');
    expect(getStarTierForCount(10, 10)).toBe('bronze');
    expect(getStarTierForCount(11, 10)).toBe('silver');
    expect(getStarTierForCount(20, 10)).toBe('silver');
    expect(getStarTierForCount(21, 10)).toBe('gold');
  });

  it('returns completed star count', () => {
    expect(getCompletedStarCount(0, 40)).toBe(0);
    expect(getCompletedStarCount(39, 40)).toBe(0);
    expect(getCompletedStarCount(40, 40)).toBe(1);
    expect(getCompletedStarCount(95, 40)).toBe(2);
  });
});
