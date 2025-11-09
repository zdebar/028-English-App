import config from "@/config/config";

/**
 * Calculates the items count in last started lesson before today.
 * @param countNotToday Learned items count excluding today's items.
 * @returns Returns the items count in last started lesson before today.
 * @throws Error if lesson size is not a positive integer.
 */
export function getPreviousCount(countNotToday: number): number {
  return countNotToday % config.lesson.lessonSize;
}

/**
 * Calculates the last started lesson number before today.
 * @param countNotToday Learned items count excluding today's items.
 * @returns Returns last started lesson number before today.
 */
export function getLessonStarted(countNotToday: number): number {
  return Math.floor(countNotToday / config.lesson.lessonSize);
}

/**
 * Calculates today's lessons items counts.
 * @param previousCount Items count in last started lesson before today
 * @param todayCount Today's learned items count
 * @returns Array of items counts in today's lessons
 */
export function getTodayLessonItems(
  previousCount: number,
  todayCount: number
): number[] {
  const lessonCounts: number[] = [];
  const lessonSize = config.lesson.lessonSize;

  const firstLesson = Math.min(todayCount, lessonSize - previousCount);
  if (firstLesson > 0) {
    lessonCounts.push(firstLesson);
    todayCount -= firstLesson;
  }

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
 * @param all Lerned items count including today's items
 * @param today Learned items count for today
 * @returns Array of tuples [lessonNumber, previousCount, todayCount]
 */
export function getLessonProgress(
  all: number,
  today: number
): [number, number, number][] {
  const previousCount = getPreviousCount(all - today);
  const lessonNumber = getLessonStarted(all - today);
  const todayCounts = getTodayLessonItems(previousCount, today);

  const result: [number, number, number][] = todayCounts.map(
    (todayCount, index) => {
      const prevCount = index === 0 ? previousCount : 0;
      return [lessonNumber + index + 1, prevCount, todayCount];
    }
  );

  return result;
}
