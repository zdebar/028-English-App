import { describe, expect, it } from 'vitest';
import type { UserItemLocal } from '@/types/user-item.types';
import { getEffectiveProgress } from '@/utils/progress.utils';

const NULL_DATE = '9999-12-31T23:59:59+00:00';

function makeItem(overrides: Partial<UserItemLocal> = {}): UserItemLocal {
  return {
    progress_cz_to_en: 0,
    progress_en_to_cz: 0,
    mastered_at_cz_to_en: NULL_DATE,
    mastered_at_en_to_cz: NULL_DATE,
    ...overrides,
  } as UserItemLocal;
}

describe('progress utilities', () => {
  it('clamps unfinished progress and treats mastered directions as full', () => {
    const item = makeItem({
      progress_cz_to_en: 999,
      progress_en_to_cz: 3,
      mastered_at_cz_to_en: '2026-08-31T10:00:00.000Z',
    });

    expect(getEffectiveProgress(item, 'czToEn')).toBe(10);
    expect(getEffectiveProgress(item, 'enToCz')).toBe(3);
  });

  it('treats a mastered direction as full progress', () => {
    const skipped = makeItem({
      progress_cz_to_en: 3,
      mastered_at_cz_to_en: '2026-08-31T10:00:00.000Z',
    });

    expect(getEffectiveProgress(skipped, 'czToEn')).toBe(10);
  });
});
