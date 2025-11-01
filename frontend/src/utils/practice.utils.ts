import config from "@/config/config";
import type { UserItemLocal } from "@/types/local.types";

/**
 * Alternates the direction of the words based on their progress.
 * @param progress - The progress value.
 * @returns True if direction is CZ -> EN, false otherwise.
 */
export function alternateDirection(progress: number): boolean {
  return progress % 2 === 0;
}

/**
 * Returns the next review date based on the progress and SRS intervals.
 */
export function getNextAt(progress: number): string {
  const interval = config.SRS[progress];
  if (interval === undefined) return config.nullReplacementDate;

  const randomFactor = 1 + config.srsRandomness * (Math.random() * 2 - 1);
  const randomizedInterval = Math.round(interval * randomFactor);
  const nextDate = new Date(Date.now() + randomizedInterval * 1000);
  return nextDate.toISOString();
}

/**
 * Sorts practice items by odd progress first.
 */
export function sortOddEvenByProgress(items: UserItemLocal[]): UserItemLocal[] {
  return items.sort((a, b) => {
    // Sort by odd progress first
    const oddA = a.progress % 2;
    const oddB = b.progress % 2;
    if (oddA !== oddB) return oddB - oddA;

    // Sort by sequence (ascending)
    return a.sequence - b.sequence;
  });
}
