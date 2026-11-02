import { describe, expect, it } from 'vitest';

import { assertPositiveInteger } from '@/utils/assertions.utils';

describe('assertions.utils', () => {
  describe('assertPositiveInteger', () => {
    it('accepts positive integers', () => {
      expect(() => assertPositiveInteger(1, 'deckSize')).not.toThrow();
      expect(() => assertPositiveInteger(99, 'deckSize')).not.toThrow();
    });

    it('throws for null/undefined, zero, negatives, and non-integers', () => {
      expect(() => assertPositiveInteger(undefined as any, 'deckSize')).toThrow(
        'deckSize: undefined must be a positive integer.',
      );
      expect(() => assertPositiveInteger(0, 'deckSize')).toThrow(
        'deckSize: 0 must be a positive integer.',
      );
      expect(() => assertPositiveInteger(-3, 'deckSize')).toThrow(
        'deckSize: -3 must be a positive integer.',
      );
      expect(() => assertPositiveInteger(1.1, 'deckSize')).toThrow(
        'deckSize: 1.1 must be a positive integer.',
      );
    });
  });
});
