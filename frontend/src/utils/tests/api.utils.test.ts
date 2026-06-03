import { describe, expect, it } from 'vitest';

import { parseId } from '@/utils/api.utils';

describe('api.utils', () => {
  describe('parseId', () => {
    it('returns integer id when input is a positive integer', () => {
      expect(parseId('1')).toBe(1);
      expect(parseId('42')).toBe(42);
    });

    it('returns null for missing, zero, negative, and non-integer values', () => {
      expect(parseId(undefined)).toBeNull();
      expect(parseId('0')).toBeNull();
      expect(parseId('-1')).toBeNull();
      expect(parseId('1.5')).toBeNull();
      expect(parseId('abc')).toBeNull();
    });
  });
});