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
 *  is the first lesson with zero items started
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

  const allLessons = levelsOverview ? levelsOverview.flatMap((level: any) => level.lessons) : [];
  const nextZeroLessonId = allLessons
    .filter((lesson) => lesson[countKey] === 0)
    .reduce(
      (minLessonId, lesson) =>
        minLessonId === null || lesson.lesson_id! < minLessonId ? lesson.lesson_id! : minLessonId,
      null as number | null,
    );
  const lessons = allLessons.filter(
    (lesson: any) =>
      lesson[todayKey] > 0 ||
      (lesson[countKey] > 0 && lesson[countKey] !== lesson.totalCount) ||
      (nextZeroLessonId != null && lesson.lesson_id === nextZeroLessonId),
  );
  return lessons;
}
