import config from '@/config/config';
import type { LessonOverviewType, LevelOverviewType } from '@/types/generic.types';

/**
 * Calculates how many items were already completed in the active lesson before today.
 *
 * @param countNotToday Started or mastered item count excluding today's items.
 * @returns A value from 0 up to lessonSize - 1.
 */
export function getPreviousCount(countNotToday: number): number {
  return countNotToday % config.lesson.lessonSize;
}

/**
 * Calculates the one-based lesson number reached before today's progress.
 *
 * @param countNotToday Started or mastered item count excluding today's items.
 * @returns The one-based lesson number containing that count.
 */
export function getLessonStarted(countNotToday: number): number {
  return Math.floor(countNotToday / config.lesson.lessonSize) + 1;
}

/**
 * Selects dashboard lessons that should remain visible for current progress.
 *
 * @param levelsOverview Level overview records; missing or non-array lesson lists are ignored.
 * @param mode Progress fields to inspect: started progress by default, or mastered progress.
 * @returns In-progress lessons, the first eligible next lesson, or the final lesson as a fallback.
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
