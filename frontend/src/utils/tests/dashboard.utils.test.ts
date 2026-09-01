import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/config/config', () => ({
  default: {
    lesson: {
      lessonSize: 5,
    },
  },
}));

import { getInProgressLessons } from '../dashboard.utils';

describe('dashboard.utils', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getInProgressLessons', () => {
    it('returns every lesson started today across levels', () => {
      const levelsOverview = [
        {
          lessons: [
            { id: 1, sort_order: 1, startedCount: 0, startedTodayCount: 0 },
            { id: 3, sort_order: 3, startedCount: 2, startedTodayCount: 1 },
          ],
        },
        {
          lessons: [
            { id: 2, sort_order: 2, startedCount: 1, startedTodayCount: 1 },
            { id: 4, sort_order: 4, startedCount: 10, startedTodayCount: 0 },
          ],
        },
      ] as any;

      expect(getInProgressLessons(levelsOverview).map((lesson) => lesson.id)).toEqual([2, 3]);
    });

    it('returns empty array for invalid input', () => {
      expect(getInProgressLessons(null as any)).toEqual([]);
      expect(getInProgressLessons([])).toEqual([]);
    });

    it('returns the first lesson when nothing has been started today', () => {
      const nothingStarted = [
        {
          lessons: [
            { id: 1, sort_order: 1, startedCount: 0, startedTodayCount: 0 },
            { id: 2, sort_order: 2, startedCount: 0, startedTodayCount: 0 },
          ],
        },
      ] as any;

      expect(getInProgressLessons(nothingStarted).map((lesson) => lesson.id)).toEqual([1]);
    });

    it('returns the last started lesson when nothing was started today', () => {
      const startedWithoutTodayData = [
        {
          lessons: [
            { id: 1, sort_order: 1, startedCount: 4, startedTodayCount: 0 },
            { id: 2, sort_order: 2, startedCount: 0, startedTodayCount: 0 },
            { id: 3, sort_order: 3, startedCount: 8, startedTodayCount: 0 },
          ],
        },
      ] as any;

      expect(getInProgressLessons(startedWithoutTodayData).map((lesson) => lesson.id)).toEqual([3]);
    });
  });
});
