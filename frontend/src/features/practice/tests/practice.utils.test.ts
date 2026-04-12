import { describe, expect, it } from 'vitest';

import { alternateDirection } from '@/features/practice/practice.utils';

describe('practice.utils', () => {
  it('returns true for even progress values and false for odd values', () => {
    expect(alternateDirection(0)).toBe(true);
    expect(alternateDirection(2)).toBe(true);
    expect(alternateDirection(1)).toBe(false);
    expect(alternateDirection(3)).toBe(false);
  });

  it('throws for negative or non-integer progress', () => {
    expect(() => alternateDirection(-1)).toThrow();
    expect(() => alternateDirection(1.5)).toThrow();
  });
});
