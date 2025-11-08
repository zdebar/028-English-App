import config from "@/config/config";

export function getPreviousCount(countNotToday: number): number {
  return countNotToday % config.lessonSize;
}

export function getLessonStarted(countNotToday: number): number {
  return Math.floor(countNotToday / config.lessonSize);
}

export function getTodayLessonItems(
  previousCount: number,
  todayCount: number
): number[] {
  const lessonCounts: number[] = [];
  const lessonSize = config.lessonSize;

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
