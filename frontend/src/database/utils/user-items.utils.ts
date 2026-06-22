import type { UserItemPractice, UserItemLocal } from '@/types/user-item.types';
import config from '@/config/config';

const NULL_DATE = config.database.nullReplacementDate;

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
  item.started_at = NULL_DATE;
  item.next_at = NULL_DATE;
  item.mastered_at = NULL_DATE;
  item.updated_at = new Date().toISOString();
  item.progress = 0;
}

