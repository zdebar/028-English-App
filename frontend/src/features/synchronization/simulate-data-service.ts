import UserBlock from '@/database/models/user-blocks';
import UserItem from '@/database/models/user-items';
import { db } from '@/database/models/db';
import { assertNonEmptyString } from '@/utils/assertions.utils';

/**
 * Atomically creates the anonymous-user progress fixture and invalidates item-derived Home state.
 *
 * @param userId Non-empty anonymous user id whose local progress should be simulated.
 * @param dateTime Shared ISO timestamp for every simulated item and block transition.
 * @returns Number of user items updated.
 */
export async function simulateUserProgress(
  userId: string,
  dateTime: string = new Date(Date.now()).toISOString(),
): Promise<number> {
  assertNonEmptyString(userId, 'userId');

  const itemCount = await db.transaction('rw', db.user_items, db.user_blocks, async () => {
    const updatedItemCount = await UserItem.simulateData(userId, dateTime);
    await UserBlock.simulateInitialTrainingProgress(userId, dateTime);
    return updatedItemCount;
  });

  return itemCount;
}
