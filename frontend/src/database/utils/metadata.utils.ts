import { TableName } from '@/types/local.types';

/**
 * Determines whether a table is user-specific based on its name.
 * @param tableName - The name of the table to check.
 * @returns `true` if the table is a user-specific table (UserScores or UserItems), `false` otherwise.
 */
export function isUserSpecificTable(tableName: string): boolean {
  return tableName === TableName.UserScores || tableName === TableName.UserItems;
}

/**
 * Validates that userId is appropriately provided based on the table type.
 * @param tableName - The name of the table to validate against
 * @param userId - Optional user identifier to validate
 * @throws {Error} If userId is required but not provided for user-specific tables
 * @throws {Error} If userId is provided but should not be for non-user-specific tables
 * @return boolean indicating whether the table is user-specific
 */
export function validateUserIdUsage(tableName: TableName, userId?: string) {
  const isUserSpecific = isUserSpecificTable(tableName);
  if (isUserSpecific && !userId) {
    throw new Error('userId is required for user-specific tables');
  }
  if (!isUserSpecific && userId) {
    throw new Error('userId should not be provided for non-user-specific tables');
  }
  return isUserSpecific;
}
