import { describe, expect, it, vi } from 'vitest';

vi.mock('@/config/config', () => ({
  default: {
    lesson: {
      lessonSize: 5,
    },
  },
}));

import {
  getLessonProgress,
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

  describe('getLessonProgress', () => {
    it('returns correct lesson progress', () => {
      expect(getLessonProgress(12, 8)).toEqual([
        { lessonId: 1, previousCount: 4, todayCount: 1 },
        { lessonId: 2, previousCount: 0, todayCount: 5 },
        { lessonId: 3, previousCount: 0, todayCount: 2 },
      ]);
      expect(getLessonProgress(10, 10)).toEqual([
        { lessonId: 1, previousCount: 0, todayCount: 5 },
        { lessonId: 2, previousCount: 0, todayCount: 5 },
      ]);
    });
    it('throws if all < 0 or today < 0', () => {
      expect(() => getLessonProgress(-1, 0)).toThrow();
      expect(() => getLessonProgress(0, -1)).toThrow();
    });
    it('throws if all < today', () => {
      expect(() => getLessonProgress(5, 6)).toThrow();
    });
  });
});
