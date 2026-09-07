import type { LessonOverviewType, LevelOverviewType } from '@/types/generic.types';

/**
 * Selects dashboard lessons that should remain visible for today's started items.
 *
 * @param levelsOverview Level overview records; missing or non-array lesson lists are ignored.
 * @returns Lessons changed today, the first lesson when nothing is initiated, or the last
 * initiated lesson as a fallback.
 */
export function getInProgressLessons(levelsOverview: LevelOverviewType[]): LessonOverviewType[] {
  const sortedLessons = sortLessons(flattenLessons(levelsOverview));

  if (sortedLessons.length === 0) {
    return [];
  }

  const changedLessons = sortedLessons.filter(hasItemsStartedToday);
  if (changedLessons.length > 0) return changedLessons;

  const hasInitiatedLessons = sortedLessons.some(hasInitiatedItems);
  if (!hasInitiatedLessons) return [sortedLessons[0]];

  const lastInitiatedLesson = [...sortedLessons].reverse().find(hasInitiatedItems);
  return lastInitiatedLesson == null ? [sortedLessons[0]] : [lastInitiatedLesson];
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

function hasItemsStartedToday(lesson: LessonOverviewType): boolean {
  return (lesson.startedTodayCount ?? 0) > 0;
}

function hasInitiatedItems(lesson: LessonOverviewType): boolean {
  return (lesson.initiatedCount ?? 0) > 0;
}
