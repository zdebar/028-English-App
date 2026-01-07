import config from '@/config/config';
import type { LessonsLocal } from '@/types/local.types';

/**
 * Calculates the items count in last started lesson before today.
 * @param countNotToday Started items count excluding today's items.
 * @returns Returns the items count in last started lesson before today.
 * @throws Error if countNotToday or lessonSize is invalid.
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
  todayCount -= firstLesson;

  const fullLessons = Math.floor(todayCount / lessonSize);
  for (let i = 0; i < fullLessons; i++) {
    lessonCounts.push(lessonSize);
  }
  todayCount -= fullLessons * lessonSize;

  if (todayCount > 0) {
    lessonCounts.push(todayCount);
  }

  return lessonCounts;
}

/**
 * Calculates lesson progress data.
 * @param all Started items count including today's items.
 * @param today Started items count for today.
 * @returns Array of LessonsLocal objects.
 */
export function getLessonProgress(all: number, today: number): LessonsLocal[] {
  if (all < today) {
    throw new Error("'all' must be greater than or equal to 'today'.");
  }

  const previousCount = getPreviousCount(all - today);
  const lessonNumber = getLessonStarted(all - today);
  const todayCounts = getTodayStartedItems(previousCount, today);

  const result: LessonsLocal[] = todayCounts.map((todayCount, index) => {
    const prevCount = index === 0 ? previousCount : 0;
    return {
      lessonId: lessonNumber + index,
      previousCount: prevCount,
      todayCount,
    };
  });

  return result;
}
