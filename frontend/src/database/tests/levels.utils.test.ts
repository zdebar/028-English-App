import { describe, expect, it } from 'vitest';
import { aggregateLevels } from '@/database/utils/levels.utils';
import type { LessonType, LevelType } from '@/types/generic.types';
import type { UserItemLocal } from '@/types/user-item.types';

describe('aggregateLevels', () => {
  it('aggregates started counts and excludes unstarted items', () => {
    const levels = [{ id: 1, name: 'A1', sort_order: 1 }] as LevelType[];
    const lessons = [{ id: 10, level_id: 1, name: 'Lesson 1', sort_order: 1 }] as LessonType[];
    const items = [
      {
        item_id: 100,
        lesson_id: 10,
        progress_cz_to_en: 2,
        progress_en_to_cz: 1,
        started_at: '2026-07-27T08:00:00.000Z',
        deleted_at: '9999-12-31T23:59:59+00:00',
        mastered_at_cz_to_en: '2026-07-27T09:00:00.000Z',
        mastered_at_en_to_cz: '9999-12-31T23:59:59+00:00',
      },
      {
        item_id: 101,
        lesson_id: 10,
        progress_cz_to_en: 0,
        progress_en_to_cz: 0,
        started_at: '9999-12-31T23:59:59+00:00',
        deleted_at: '9999-12-31T23:59:59+00:00',
        mastered_at_cz_to_en: '9999-12-31T23:59:59+00:00',
        mastered_at_en_to_cz: '9999-12-31T23:59:59+00:00',
      },
    ] as UserItemLocal[];

    const result = aggregateLevels(items, lessons, levels, '2026-07-27');

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      startedCount: 1,
      startedTodayCount: 1,
      totalCount: 2,
    });
    expect(result[0].lessons[0]).toMatchObject({
      startedCount: 1,
      startedTodayCount: 1,
      totalCount: 2,
    });
    expect(result[0]).not.toHaveProperty('masteredCount');
    expect(result[0].lessons[0]).not.toHaveProperty('masteredTodayCount');
  });
});
