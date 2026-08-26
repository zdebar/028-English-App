export type StarTier = 'bronze' | 'silver' | 'gold';

/**
 * Maps a completed tier index to the visible star tier.
 *
 * @param tierIndex Zero-based tier index; values below 1 are bronze and values above 1 are gold.
 * @returns bronze for tier 0, silver for tier 1, and gold for all later tiers.
 */
export function getStarTier(tierIndex: number): StarTier {
  if (tierIndex <= 0) return 'bronze';
  if (tierIndex === 1) return 'silver';
  return 'gold';
}

/** Returns the visual tier of a one-based completed star count. */
export function getStarTierForCount(starCount: number, starsPerRow: number): StarTier {
  const safeStarCount = Math.max(1, Math.floor(starCount));
  const safeStarsPerRow = Math.max(1, Math.floor(starsPerRow));
  return getStarTier(Math.floor((safeStarCount - 1) / safeStarsPerRow));
}

/**
 * Calculates the number of fully completed stars.
 *
 * @param totalCount Total completed actions; fractional and negative values are normalized.
 * @param chunkSize Number of actions required for one star; values below 1 are treated as 1.
 * @returns The number of full chunks completed.
 */
export function getCompletedStarCount(totalCount: number, chunkSize: number): number {
  const safeTotalCount = Math.max(0, Math.floor(totalCount));
  const safeChunkSize = Math.max(1, Math.floor(chunkSize));

  return Math.floor(safeTotalCount / safeChunkSize);
}
