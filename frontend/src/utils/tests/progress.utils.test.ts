import { describe, expect, it } from 'vitest';
import type { UserItemLocal } from '@/types/user-item.types';
import config from '@/config/config';
import { isInitiated } from '@/database/practice/user-item-progress';
import { formatProgress } from '@/utils/progress.utils';

const NULL_DATE = '9999-12-31T23:59:59+00:00';
const SRS_LENGTH = config.srs.intervals.length;

function makeItem(overrides: Partial<UserItemLocal> = {}): UserItemLocal {
  return {
    progress_cz_to_en: 0,
    mastered_at_cz_to_en: NULL_DATE,
    ...overrides,
  } as UserItemLocal;
}

describe('progress utilities', () => {
  it('formats progress using the configured SRS length', () => {
    expect(formatProgress(0)).toBe(`0 / ${SRS_LENGTH}`);
    expect(formatProgress(null)).toBeUndefined();
  });

  it.each([
    ['a started item', { started_at: '2026-08-31T10:00:00.000Z' }, true],
    [
      'an initial-training skip',
      {
        started_at: NULL_DATE,
        mastered_at_cz_to_en: '2026-08-31T10:00:00.000Z',
      },
      true,
    ],
    ['an untouched item', { started_at: NULL_DATE }, false],
  ])('identifies %s as initiated=%s', (_name, overrides, expected) => {
    expect(isInitiated(makeItem(overrides))).toBe(expected);
  });
});
