import { TableName } from '@/types/table.types';

/**
 * Checks whether a table stores per-user rows and must be synced with a user id.
 *
 * @param tableName Table name to inspect.
 * @returns true for user_scores, user_items, and user_blocks tables.
 */
export function isUserSpecificTable(tableName: string): boolean {
  return (
    tableName === TableName.UserScores ||
    tableName === TableName.UserItems ||
    tableName === TableName.UserBlocks
  );
}

/**
 * Validates whether a sync metadata operation uses userId correctly for its table.
 *
 * @param tableName Table whose metadata row is being accessed.
 * @param userId Required for user-specific tables and forbidden for shared tables.
 * @returns true when the table is user-specific, false for shared tables.
 * @throws Error when userId is missing for a user-specific table or provided for a shared table.
 */
export function validateUserIdUsage(tableName: TableName, userId?: string) {
  const isUserSpecific = isUserSpecificTable(tableName);
  if (isUserSpecific && !userId) {
    throw new Error(`userId is required for user-specific tables: ${tableName} userId: ${userId}`);
  }
  if (!isUserSpecific && userId) {
    throw new Error(
      `userId should not be provided for non-user-specific tables: ${tableName} userId: ${userId}`,
    );
  }
  return isUserSpecific;
}
