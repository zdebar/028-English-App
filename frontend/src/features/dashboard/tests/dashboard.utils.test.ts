import { describe, expect, it, vi } from 'vitest';

vi.mock('@/config/config', () => ({
  default: {
    lesson: {
      lessonSize: 5,
    },
  },
}));

import {
  getInProgressLessons,
  getLessonStarted,
  getPreviousCount,
  getTodayStartedItems,
} from '../dashboard.utils';

describe('dashboard.utils', () => {
  describe('getPreviousCount', () => {
    it('returns correct count for non-today items', () => {
      expect(getPreviousCount(12)).toBe(2);
      expect(getPreviousCount(0)).toBe(0);
      expect(getPreviousCount(5)).toBe(0);
    });
  });

  describe('getLessonStarted', () => {
    it('returns correct lesson number', () => {
      expect(getLessonStarted(12)).toBe(3);
      expect(getLessonStarted(0)).toBe(1);
      expect(getLessonStarted(5)).toBe(2);
    });
  });

  describe('getTodayStartedItems', () => {
    it('returns correct lesson item counts', () => {
      expect(getTodayStartedItems(2, 8)).toEqual([3, 5]);
      expect(getTodayStartedItems(0, 12)).toEqual([5, 5, 2]);
      expect(getTodayStartedItems(4, 1)).toEqual([1]);
    });
    it('throws if previousCount >= lessonSize', () => {
      expect(() => getTodayStartedItems(5, 1)).toThrow();
    });
  });

  describe('getInProgressLessons', () => {
    const levelsOverview = [
      {
        lessons: [
          {
            lesson_id: 1,
            totalCount: 10,
            startedCount: 0,
            startedTodayCount: 0,
            masteredCount: 0,
            masteredTodayCount: 0,
          },
          {
            lesson_id: 2,
            totalCount: 10,
            startedCount: 3,
            startedTodayCount: 0,
            masteredCount: 0,
            masteredTodayCount: 0,
          },
          {
            lesson_id: 3,
            totalCount: 10,
            startedCount: 5,
            startedTodayCount: 1,
            masteredCount: 2,
            masteredTodayCount: 0,
          },
          {
            lesson_id: 4,
            totalCount: 10,
            startedCount: 10,
            startedTodayCount: 0,
            masteredCount: 10,
            masteredTodayCount: 2,
          },
        ],
      },
    ] as any;

    it('returns started in-progress lessons plus first zero-started lesson', () => {
      expect(getInProgressLessons(levelsOverview, 'started').map((x) => x.lesson_id)).toEqual([
        1, 2, 3,
      ]);
    });

    it('returns mastered in-progress lessons plus first zero-mastered lesson', () => {
      expect(getInProgressLessons(levelsOverview, 'mastered').map((x) => x.lesson_id)).toEqual([
        1, 3, 4,
      ]);
    });

    it('returns empty array for invalid input', () => {
      expect(getInProgressLessons(null as any)).toEqual([]);
      expect(getInProgressLessons([])).toEqual([]);
    });
  });
});
