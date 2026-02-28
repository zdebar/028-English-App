import { describe, expect, it } from 'vitest';

import {
  assertInteger,
  assertNonNegativeInteger,
  assertPositiveInteger,
} from '@/utils/assertions.utils';

describe('assertions.utils', () => {
  describe('assertInteger', () => {
    it('accepts integers at or above minimum', () => {
      expect(() => assertInteger(0, 'count')).not.toThrow();
      expect(() => assertInteger(5, 'count')).not.toThrow();
      expect(() => assertInteger(3, 'count', 3)).not.toThrow();
    });

    it('throws for null/undefined, non-integer, and below minimum', () => {
      expect(() => assertInteger(undefined as any, 'count')).toThrow(
        'count: undefined must be an integer >= 0.',
      );
      expect(() => assertInteger(1.5, 'count')).toThrow('count: 1.5 must be an integer >= 0.');
      expect(() => assertInteger(2, 'count', 3)).toThrow('count: 2 must be an integer >= 3.');
    });
  });

  describe('assertNonNegativeInteger', () => {
    it('accepts non-negative integers', () => {
      expect(() => assertNonNegativeInteger(0, 'index')).not.toThrow();
      expect(() => assertNonNegativeInteger(10, 'index')).not.toThrow();
    });

    it('throws for null/undefined, non-integer, and negative values', () => {
      expect(() => assertNonNegativeInteger(undefined as any, 'index')).toThrow(
        'index: undefined must be a non-negative integer.',
      );
      expect(() => assertNonNegativeInteger(2.2, 'index')).toThrow(
        'index: 2.2 must be a non-negative integer.',
      );
      expect(() => assertNonNegativeInteger(-1, 'index')).toThrow(
        'index: -1 must be a non-negative integer.',
      );
    });
  });

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
