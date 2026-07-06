import type { UserItemPractice, UserItemLocal } from '@/types/user-item.types';
import config from '@/config/config';

const NULL_DATE = config.database.nullReplacementDate;

/**
 * Marks the first unseen grammar item in a practice deck.
 *
 * @param practiceItems Practice items to decorate without mutating the originals.
 * @param startedGrammarIdSet Grammar ids already started by the user.
 * @returns Copies of the input items with show_new_grammar_indicator true only for the first
 * item whose grammar_id is non-zero and not in startedGrammarIdSet.
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
 * Calculates the next SRS review timestamp for a progress level.
 *
 * @param progress Progress index used to read config.srs.intervals.
 * @returns Future ISO timestamp with configured randomness, or the null replacement date when
 * no interval exists for the progress value.
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
 * Mutates a user item back to its unstarted local state.
 *
 * @param item Local user item object to reset in place.
 */
export function resetUserItem(item: UserItemLocal): void {
  item.started_at = NULL_DATE;
  item.next_at = NULL_DATE;
  item.mastered_at = NULL_DATE;
  item.updated_at = new Date().toISOString();
  item.progress = 0;
}

