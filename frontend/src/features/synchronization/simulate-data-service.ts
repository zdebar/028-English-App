import { refreshPracticeAvailability } from '@/features/practice/practice-availability-controller';
import UserItem from '@/database/models/user-items';
import { db } from '@/database/models/db';
import { assertNonEmptyString } from '@/utils/assertions.utils';
import { invalidateReviewArrays } from '@/features/practice/review-prefetch';

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

  const itemCount = await db.transaction(
    'rw',
    db.user_items,
    db.user_lessons,
    db.lessons,
    db.levels,
    async () => {
      const items = await UserItem.getSimulationCandidates(userId);
      const itemCount = await UserItem.simulateData(items, dateTime);
      const startedLessonIds = [...new Set(items.map((item) => item.lesson_id))];
      await db.user_lessons.bulkPut(
        startedLessonIds.map((lessonId) => ({
          user_id: userId,
          lesson_id: lessonId,
          started_at: dateTime,
        })),
      );
      return itemCount;
    },
  );

  invalidateReviewArrays(userId);
  void refreshPracticeAvailability(userId);
  return itemCount;
}
