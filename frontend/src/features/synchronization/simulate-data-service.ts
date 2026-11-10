import UserItem from '@/database/models/user-items';
import { db } from '@/database/models/db';
import { assertNonEmptyString } from '@/utils/assertions.utils';
import { publishDataChanges } from '@/database/state/data-store';
import type { AppDataChanges } from '@/database/state/data-types';

/**
 * Atomically creates the anonymous-user progress fixture.
 *
 * @param userId Non-empty anonymous user id whose local progress should be simulated.
 * @param dateTime Shared ISO timestamp for every simulated item transition.
 * @returns Number of user items updated.
 */
export async function simulateUserProgress(
  userId: string,
  dateTime: string = new Date(Date.now()).toISOString(),
): Promise<number> {
  assertNonEmptyString(userId, 'userId');

  const result = await db.transaction(
    'rw',
    db.user_items,
    db.user_lessons,
    db.lessons,
    db.levels,
    async () => {
      const items = await UserItem.getSimulationCandidates(userId);
      const simulation = await UserItem.simulateData(items, dateTime);
      const startedLessonIds = [...new Set(items.map((item) => item.lesson_id))];
      const existingLessons = await db.user_lessons.where('user_id').equals(userId).toArray();
      const existingLessonIds = new Set(existingLessons.map((lesson) => lesson.lesson_id));
      const startedLessons = startedLessonIds
        .filter((lessonId) => !existingLessonIds.has(lessonId))
        .map((lessonId) => ({
          user_id: userId,
          lesson_id: lessonId,
          started_at: dateTime,
        }));
      if (startedLessons.length > 0) await db.user_lessons.bulkAdd(startedLessons);
      return { ...simulation, startedLessons };
    },
  );

  const lessonChanges: AppDataChanges = result.startedLessons.length > 0
    ? { user_lessons: { upserted: result.startedLessons } }
    : {};
  publishDataChanges(userId, {
    user_items: { upserted: result.items },
    ...lessonChanges,
  });
  return result.count;
}
