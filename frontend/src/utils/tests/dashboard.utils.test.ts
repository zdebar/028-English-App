import { afterEach, describe, expect, it, vi } from 'vitest';

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
  triggerDailyCountUpdatedEvent,
  triggerLevelsUpdatedEvent,
  triggerNamedEvent,
} from '../dashboard.utils';

describe('dashboard.utils', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

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

  describe('event triggers', () => {
    it('triggerNamedEvent dispatches custom event with user id detail', () => {
      const dispatchSpy = vi.spyOn(globalThis, 'dispatchEvent');

      triggerNamedEvent('levelsUpdated', 'user-1');

      expect(dispatchSpy).toHaveBeenCalledTimes(1);
      const dispatchedEvent = dispatchSpy.mock.calls[0][0] as CustomEvent;
      expect(dispatchedEvent.type).toBe('levelsUpdated');
      expect(dispatchedEvent.detail).toEqual({ userId: 'user-1' });
    });

    it('triggerNamedEvent validates required inputs', () => {
      expect(() => triggerNamedEvent('', 'user-1')).toThrow('eventName is required.');
      expect(() => triggerNamedEvent('levelsUpdated', '')).toThrow('userId is required.');
    });

    it('triggerLevelsUpdatedEvent dispatches levelsUpdated event', () => {
      const dispatchSpy = vi.spyOn(globalThis, 'dispatchEvent');

      triggerLevelsUpdatedEvent('user-2');

      const dispatchedEvent = dispatchSpy.mock.calls.at(-1)?.[0] as CustomEvent;
      expect(dispatchedEvent.type).toBe('levelsUpdated');
      expect(dispatchedEvent.detail).toEqual({ userId: 'user-2' });
    });

    it('triggerDailyCountUpdatedEvent dispatches with optional dailyCount', () => {
      const dispatchSpy = vi.spyOn(globalThis, 'dispatchEvent');

      triggerDailyCountUpdatedEvent('user-3', 7);
      triggerDailyCountUpdatedEvent('user-3');

      const eventCalls = dispatchSpy.mock.calls.slice(-2);
      const firstEvent = eventCalls[0][0] as CustomEvent;
      const secondEvent = eventCalls[1][0] as CustomEvent;

      expect(firstEvent.type).toBe('dailyCountUpdated');
      expect(firstEvent.detail).toEqual({ userId: 'user-3', dailyCount: 7 });

      expect(secondEvent.type).toBe('dailyCountUpdated');
      expect(secondEvent.detail).toEqual({ userId: 'user-3' });
    });

    it('triggerDailyCountUpdatedEvent validates user id', () => {
      expect(() => triggerDailyCountUpdatedEvent('')).toThrow('userId is required.');
    });
  });
});
