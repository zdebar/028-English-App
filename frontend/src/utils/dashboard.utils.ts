import type { LessonOverviewType, LevelOverviewType } from '@/types/generic.types';

/**
 * Selects dashboard lessons that should remain visible for today's progress.
 *
 * @param levelsOverview Level overview records; missing or non-array lesson lists are ignored.
 * @returns Lessons changed today, the first lesson when nothing is started, or the last started
 * lesson as a fallback.
 */
export function getInProgressLessons(levelsOverview: LevelOverviewType[]): LessonOverviewType[] {
  const sortedLessons = sortLessons(flattenLessons(levelsOverview));

  if (sortedLessons.length === 0) {
    return [];
  }

  const changedLessons = sortedLessons.filter(hasTodayProgressChange);
  if (changedLessons.length > 0) return changedLessons;

  const hasStartedLessons = sortedLessons.some(hasStartedItems);
  if (!hasStartedLessons) return [sortedLessons[0]];

  const lastStartedLesson = [...sortedLessons].reverse().find(hasStartedItems);
  return lastStartedLesson == null ? [sortedLessons[0]] : [lastStartedLesson];
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

function hasTodayProgressChange(lesson: LessonOverviewType): boolean {
  return (lesson.dailyProgressChange ?? 0) !== 0;
}

function hasStartedItems(lesson: LessonOverviewType): boolean {
  return (lesson.startedCount ?? 0) > 0;
}
