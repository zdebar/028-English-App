import config from '@/config/config';
import type { LessonsOverview, LevelsOverview } from '@/types/local.types';

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
  levelsOverview: LevelsOverview[],
  mode: 'started' | 'mastered' = 'started',
): LessonsOverview[] {
  const countKey = mode === 'mastered' ? 'masteredCount' : 'startedCount';
  const todayKey = mode === 'mastered' ? 'masteredTodayCount' : 'startedTodayCount';

  const allLessons = Array.isArray(levelsOverview)
    ? levelsOverview.flatMap((level: LevelsOverview) =>
        Array.isArray(level.lessons) ? level.lessons : [],
      )
    : [];

  const sortedLessons = [...allLessons].sort((a, b) => {
    if ((a.level_sort_order ?? 0) !== (b.level_sort_order ?? 0)) {
      return (a.level_sort_order ?? 0) - (b.level_sort_order ?? 0);
    }
    if ((a.lesson_sort_order ?? 0) !== (b.lesson_sort_order ?? 0)) {
      return (a.lesson_sort_order ?? 0) - (b.lesson_sort_order ?? 0);
    }
    return (a.lesson_id ?? 0) - (b.lesson_id ?? 0);
  });

  let nextZeroLessonId: number | null = null;
  for (let index = 0; index < sortedLessons.length; index++) {
    const lesson = sortedLessons[index] as any;
    const previousLesson = index > 0 ? (sortedLessons[index - 1] as any) : null;
    const isPreviousCompleted =
      previousLesson == null || previousLesson[countKey] === previousLesson.totalCount;

    if (lesson[countKey] === 0 && isPreviousCompleted) {
      nextZeroLessonId = lesson.lesson_id;
      break;
    }
  }

  return sortedLessons.filter(
    (lesson: any) =>
      lesson[todayKey] > 0 ||
      (lesson[countKey] > 0 && lesson[countKey] !== lesson.totalCount) ||
      (nextZeroLessonId != null && lesson.lesson_id === nextZeroLessonId),
  );
}
