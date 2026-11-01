import { describe, expect, it, vi } from 'vitest';

vi.mock('@/config/config', () => ({
  default: {
    database: { nullReplacementDate: '1970-01-01T00:00:00.000Z' },
    srs: {
      intervals: [10, 20, 30],
      randomness: 0.1,
    },
  },
}));

import { getNextAt } from '@/database/practice/user-item-practice';

describe('user item practice scheduling', () => {
  it('returns the null replacement date when no interval exists', () => {
    expect(getNextAt(99)).toBe('1970-01-01T00:00:00.000Z');
  });

  it('returns a randomized future timestamp from the configured interval', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1000);
    vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation(
      ((array: Uint32Array) => {
        array[0] = 2 ** 31;
        return array;
      }) as typeof globalThis.crypto.getRandomValues,
    );

    expect(getNextAt(1)).toBe(new Date(21000).toISOString());
  });
});
