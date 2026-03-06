import type { UserItemLocal, UserItemPractice } from '@/types/local.types';
import { assertNonNegativeInteger } from '@/utils/assertions.utils';
import config from '@/config/config';
import type { UserItemSQL } from '@/types/sql.types';

const NULL_DATE = config.database.nullReplacementDate;
const NULL_NUMBER = config.database.nullReplacementNumber;

/**
 * Adds a grammar indicator flag to practice items based on started grammar IDs.
 *
 * @param practiceItems - Array of UserLocal items
 * @param startedGrammarIdSet - Set of grammar IDs that have already been started
 * @returns Array of UserItemPractice with show_new_grammar_indicator flag set
 */
export function addGrammarIndicatorFlag(
  practiceItems: UserItemLocal[],
  startedGrammarIdSet: Set<number>,
): UserItemPractice[] {
  if (!Array.isArray(practiceItems)) {
    throw new Error('practiceItems must be an array.');
  }
  if (!(startedGrammarIdSet instanceof Set)) {
    throw new Error('startedGrammarIdSet must be a Set.');
  }

  const shownGrammarIds = new Set<number>();
  return practiceItems.map((item) => {
    let show = false;
    if (
      item.grammar_id !== 0 &&
      !startedGrammarIdSet.has(item.grammar_id) &&
      !shownGrammarIds.has(item.grammar_id)
    ) {
      show = true;
      shownGrammarIds.add(item.grammar_id);
    }
    return {
      ...item,
      show_new_grammar_indicator: show,
    };
  });
}

/**
 * Returns the next review date based on the user's progress with randomness.
 * @param progress Item's progress.
 * @returns Date string in ISO format for the next review.
 * @throws Error if progress is not a positive integer.
 */
export function getNextAt(progress: number): string {
  assertNonNegativeInteger(progress, 'Progress must be a non-negative integer');

  const interval = config.srs.intervals[progress];
  if (interval == null) return NULL_DATE;

  const randomFactor = 1 + config.srs.randomness * (Math.random() * 2 - 1);
  const randomizedInterval = Math.round(interval * randomFactor);
  const nextDate = new Date(Date.now() + randomizedInterval * 1000);
  return nextDate.toISOString();
}

/**
 * Resets the properties of a given `UserItemLocal` object to their initial state.
 * - Sets `started_at`, `next_at`, and `mastered_at` to the configured null replacement date.
 * - Updates `updated_at` to the current ISO timestamp.
 * - Resets `progress` to 0.
 * @param item - The user item object to reset.
 */
export function resetUserItem(item: UserItemLocal): void {
  if (!item || typeof item !== 'object') {
    throw new Error('item must be an object.');
  }

  item.started_at = NULL_DATE;
  item.next_at = NULL_DATE;
  item.mastered_at = NULL_DATE;
  item.updated_at = new Date().toISOString();
  item.progress = 0;
}

/**
 * Converts a `UserItemLocal` object to a `UserItemSQL` object, replacing specific date fields
 * with `null` if they match the configured `nullReplacementDate`.
 *
 * @param localItem - The local user item to convert.
 * @returns The converted user item suitable for SQL storage.
 */
export function convertLocalToSQL(localItem: UserItemLocal): UserItemSQL {
  if (!localItem || typeof localItem !== 'object') {
    throw new Error('localItem must be an object.');
  }

  return {
    ...localItem,
    started_at: localItem.started_at === NULL_DATE ? null : localItem.started_at,
    next_at: localItem.next_at === NULL_DATE ? null : localItem.next_at,
    mastered_at: localItem.mastered_at === NULL_DATE ? null : localItem.mastered_at,
    deleted_at: localItem.deleted_at === NULL_DATE ? null : localItem.deleted_at,
    grammar_id: localItem.grammar_id === NULL_NUMBER ? null : localItem.grammar_id,
  };
}

/**
 * Converts a SQL/RPC user item payload to local user item shape,
 * replacing nullable sortable/date fields with configured null-replacement values.
 *
 * @param sqlItem - The SQL/RPC user item payload to normalize.
 * @returns Normalized local user item.
 */
export function convertSQLToLocal(sqlItem: UserItemSQL): UserItemLocal {
  if (!sqlItem || typeof sqlItem !== 'object') {
    throw new Error('sqlItem must be an object.');
  }

  return {
    ...sqlItem,
    started_at: sqlItem.started_at ?? NULL_DATE,
    next_at: sqlItem.next_at ?? NULL_DATE,
    mastered_at: sqlItem.mastered_at ?? NULL_DATE,
    deleted_at: sqlItem.deleted_at ?? NULL_DATE,
    grammar_id: sqlItem.grammar_id ?? NULL_NUMBER,
  };
}
