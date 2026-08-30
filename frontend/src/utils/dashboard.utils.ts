import type { LessonOverviewType, LevelOverviewType } from '@/types/generic.types';

/**
 * Selects dashboard lessons that should remain visible for current progress.
 *
 * @param levelsOverview Level overview records; missing or non-array lesson lists are ignored.
 * @returns In-progress lessons, the first eligible next lesson, or the final lesson as a fallback.
 */
export function getInProgressLessons(levelsOverview: LevelOverviewType[]): LessonOverviewType[] {
  const sortedLessons = sortLessons(flattenLessons(levelsOverview));

  if (sortedLessons.length === 0) {
    return [];
  }

  const result = selectVisibleLessons(sortedLessons);

  if (result.length > 0) {
    return result;
  }

  const lastLesson = sortedLessons.at(-1);
  return lastLesson == null ? [] : [lastLesson];
}

function flattenLessons(levelsOverview: LevelOverviewType[]): LessonOverviewType[] {
  if (!Array.isArray(levelsOverview)) return [];
  return levelsOverview.flatMap((level) => (Array.isArray(level.lessons) ? level.lessons : []));
}

function compareLessons(left: LessonOverviewType, right: LessonOverviewType): number {
  const leftOrder = left.sort_order ?? 0;
  const rightOrder = right.sort_order ?? 0;
  if (leftOrder !== rightOrder) return leftOrder - rightOrder;
  return (left.id ?? 0) - (right.id ?? 0);
}

function sortLessons(lessons: LessonOverviewType[]): LessonOverviewType[] {
  return [...lessons].sort(compareLessons);
}

function isCompleted(lesson: LessonOverviewType): boolean {
  return (lesson.startedCount ?? 0) >= (lesson.totalCount ?? 0);
}

function isIncomplete(lesson: LessonOverviewType): boolean {
  const count = lesson.startedCount ?? 0;
  const totalCount = lesson.totalCount ?? 0;
  return count > 0 && count < totalCount;
}

function isFirstEligibleZero(
  lesson: LessonOverviewType,
  previousLesson: LessonOverviewType | undefined,
  firstEligibleZeroIncluded: boolean,
): boolean {
  if (firstEligibleZeroIncluded) return false;
  if ((lesson.startedCount ?? 0) !== 0) return false;
  return previousLesson === undefined || isCompleted(previousLesson);
}

function shouldIncludeLesson(
  lesson: LessonOverviewType,
  previousLesson: LessonOverviewType | undefined,
  firstEligibleZeroIncluded: boolean,
): boolean {
  const todayCount = lesson.startedTodayCount ?? 0;
  return (
    todayCount > 0 ||
    isIncomplete(lesson) ||
    isFirstEligibleZero(lesson, previousLesson, firstEligibleZeroIncluded)
  );
}

function selectVisibleLessons(lessons: LessonOverviewType[]): LessonOverviewType[] {
  const result: LessonOverviewType[] = [];
  let firstEligibleZeroIncluded = false;

  lessons.forEach((lesson, index) => {
    const previousLesson = lessons[index - 1];
    if (!shouldIncludeLesson(lesson, previousLesson, firstEligibleZeroIncluded)) return;

    result.push(lesson);
    if (isFirstEligibleZero(lesson, previousLesson, firstEligibleZeroIncluded)) {
      firstEligibleZeroIncluded = true;
    }
  });

  return result;
}
