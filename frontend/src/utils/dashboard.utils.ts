import config from '@/config/config';
import type { LessonOverviewType, LevelOverviewType } from '@/types/generic.types';

/**
 * Calculates the items count in last started lesson before today.
 * @param countNotToday Started items count excluding today's items.
 * @returns Returns the items count in last started lesson before today.

 */
export function getPreviousCount(countNotToday: number): number {
  return countNotToday % config.lesson.lessonSize;
}

/**
 * Calculates the last started lesson number before today.
 * @param countNotToday Started items count excluding today's items.
 * @returns Returns last started lesson number before today.
 */
export function getLessonStarted(countNotToday: number): number {
  return Math.floor(countNotToday / config.lesson.lessonSize) + 1;
}

/**
 * Calculates today's lessons items counts.
 * @param previousCount Items count in last started lesson before today
 * @param todayCount Today's started items count
 * @returns Array of items counts in today's lessons
 */
export function getTodayStartedItems(previousCount: number, todayCount: number): number[] {
  const lessonCounts: number[] = [];
  const lessonSize = config.lesson.lessonSize;

  if (previousCount >= lessonSize) {
    throw new Error("'previousCount' must be less than the lesson size.");
  }

  const firstLesson = Math.min(todayCount, lessonSize - previousCount);
  lessonCounts.push(firstLesson);
  let remainingCount = todayCount - firstLesson;

  const fullLessons = Math.floor(remainingCount / lessonSize);
  for (let i = 0; i < fullLessons; i++) {
    lessonCounts.push(lessonSize);
  }
  remainingCount -= fullLessons * lessonSize;

  if (remainingCount > 0) {
    lessonCounts.push(remainingCount);
  }

  return lessonCounts;
}

/**
 * Returns lessons that:
 *  have items started today, or
 *  have some items started but not all, or
 *  is the first lesson with zero items where the previous lesson is fully completed
 *
 * @param levelsOverview Array of levels overview
 * @param mode "started" (default) or "mastered" - which lesson attributes to use
 */
export function getInProgressLessons(
  levelsOverview: LevelOverviewType[],
  mode: 'started' | 'mastered' = 'started',
): LessonOverviewType[] {
  const shouldIncludeLesson = (
    todayCount: number,
    isIncomplete: boolean,
    isFirstEligibleZero: boolean,
  ) => todayCount > 0 || isIncomplete || isFirstEligibleZero;

  const countKey = mode === 'mastered' ? 'masteredCount' : 'startedCount';
  const todayKey = mode === 'mastered' ? 'masteredTodayCount' : 'startedTodayCount';

  const allLessons = Array.isArray(levelsOverview)
    ? levelsOverview.flatMap((level: LevelOverviewType) =>
        Array.isArray(level.lessons) ? level.lessons : [],
      )
    : [];

  const sortedLessons = [...allLessons].sort((a, b) => {
    if ((a.sort_order ?? 0) !== (b.sort_order ?? 0)) {
      return (a.sort_order ?? 0) - (b.sort_order ?? 0);
    }
    return (a.id ?? 0) - (b.id ?? 0);
  });

  if (sortedLessons.length === 0) {
    return [];
  }

  const result: LessonOverviewType[] = [];
  let firstEligibleZeroIncluded = false;

  for (const [index, lesson] of sortedLessons.entries()) {
    const totalCount = lesson.totalCount ?? 0;
    const count = lesson[countKey] ?? 0;
    const todayCount = lesson[todayKey] ?? 0;
    const isIncomplete = count > 0 && count < totalCount;
    const previousLesson = index > 0 ? sortedLessons[index - 1] : null;
    const previousCompleted =
      previousLesson == null || (previousLesson[countKey] ?? 0) >= (previousLesson.totalCount ?? 0);
    const isZero = count === 0;
    const isFirstEligibleZero = !firstEligibleZeroIncluded && isZero && previousCompleted;

    if (!shouldIncludeLesson(todayCount, isIncomplete, isFirstEligibleZero)) {
      continue;
    }

    result.push(lesson);
    if (isFirstEligibleZero) {
      firstEligibleZeroIncluded = true;
    }
  }

  if (result.length > 0) {
    return result;
  }

  const lastLesson = sortedLessons.at(-1);
  return lastLesson == null ? [] : [lastLesson];
}

/**
 * Triggers a custom DOM event with the specified name and attaches the user ID as event detail.
 *
 * @param eventName - The name of the custom event to trigger.
 * @param userId - The ID of the user to include in the event detail. If falsy, the event is not triggered.
 * @throws Error if userId is not provided.
 */
export function triggerNamedEvent(eventName: string, userId: string) {
  if (!eventName || eventName.trim() === '') {
    throw new Error('eventName is required.');
  }
  if (!userId || userId.trim() === '') {
    throw new Error('userId is required.');
  }

  const event = new CustomEvent(eventName, { detail: { userId } });
  globalThis.dispatchEvent(event);
}

/**
 * Triggers the 'levelsUpdated' event for a specific user.
 *
 * @param userId - The unique user identifier.
 */
export function triggerLevelsUpdatedEvent(userId: string) {
  triggerNamedEvent('levelsUpdated', userId);
}

/**
 * Triggers the 'dailyCountUpdated' event for a specific user.
 *
 * @param userId - The unique user identifier.
 */
export function triggerDailyCountUpdatedEvent(userId: string) {
  triggerNamedEvent('dailyCountUpdated', userId);
}
