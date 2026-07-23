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
    const levelsOverview = [
      {
        lessons: [
          {
            id: 1,
            sort_order: 1,
            totalCount: 10,
            startedCount: 0,
            startedTodayCount: 0,
            masteredCount: 0,
            masteredTodayCount: 0,
          },
          {
            id: 2,
            sort_order: 2,
            totalCount: 10,
            startedCount: 3,
            startedTodayCount: 0,
            masteredCount: 0,
            masteredTodayCount: 0,
          },
          {
            id: 3,
            sort_order: 3,
            totalCount: 10,
            startedCount: 5,
            startedTodayCount: 1,
            masteredCount: 2,
            masteredTodayCount: 0,
          },
          {
            id: 4,
            sort_order: 4,
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
      expect(getInProgressLessons(levelsOverview, 'started').map((x) => x.id)).toEqual([1, 2, 3]);
    });

    it('returns mastered in-progress lessons plus first zero-mastered lesson', () => {
      expect(getInProgressLessons(levelsOverview, 'mastered').map((x) => x.id)).toEqual([1, 3, 4]);
    });

    it('returns empty array for invalid input', () => {
      expect(getInProgressLessons(null as any)).toEqual([]);
      expect(getInProgressLessons([])).toEqual([]);
    });

    it('does not include zero-count lesson when previous lesson is not fully completed', () => {
      const blockedByPrevious = [
        {
          lessons: [
            {
              id: 1,
              sort_order: 1,
              totalCount: 10,
              startedCount: 4,
              startedTodayCount: 0,
              masteredCount: 4,
              masteredTodayCount: 0,
            },
            {
              id: 2,
              sort_order: 2,
              totalCount: 10,
              startedCount: 0,
              startedTodayCount: 0,
              masteredCount: 0,
              masteredTodayCount: 0,
            },
          ],
        },
      ] as any;

      expect(getInProgressLessons(blockedByPrevious, 'started').map((x) => x.id)).toEqual([1]);
    });

    it('includes first eligible zero-count lesson when previous lesson is fully completed', () => {
      const eligibleAfterCompleted = [
        {
          lessons: [
            {
              id: 1,
              sort_order: 1,
              totalCount: 10,
              startedCount: 10,
              startedTodayCount: 0,
              masteredCount: 10,
              masteredTodayCount: 0,
            },
            {
              id: 2,
              sort_order: 2,
              totalCount: 10,
              startedCount: 0,
              startedTodayCount: 0,
              masteredCount: 0,
              masteredTodayCount: 0,
            },
            {
              id: 3,
              sort_order: 3,
              totalCount: 10,
              startedCount: 0,
              startedTodayCount: 0,
              masteredCount: 0,
              masteredTodayCount: 0,
            },
          ],
        },
      ] as any;

      expect(getInProgressLessons(eligibleAfterCompleted, 'started').map((x) => x.id)).toEqual([2]);
    });
  });

});
