export type StarTier = 'bronze' | 'silver' | 'gold';

export type StarProgressState = Readonly<{
  totalCount: number;
  chunkSize: number;
  starsPerRow: number;
  completedStars: number;
  completedTiers: number;
  activeRowCompletedStars: number;
  activeStarProgress: number;
  activeTier: StarTier;
  currentChunkCount: number;
}>;

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

/**
 * Calculates progress inside the current star chunk.
 *
 * @param totalCount Total completed actions; fractional and negative values are normalized.
 * @param chunkSize Number of actions required for one star; values below 1 are treated as 1.
 * @returns The normalized remainder within the active chunk.
 */
export function getCurrentStarProgressCount(totalCount: number, chunkSize: number): number {
  const safeTotalCount = Math.max(0, Math.floor(totalCount));
  const safeChunkSize = Math.max(1, Math.floor(chunkSize));

  return safeTotalCount % safeChunkSize;
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

/**
 * Builds the normalized star progress state used by star UI components.
 *
 * @param totalCount Total completed actions; fractional and negative values are normalized.
 * @param chunkSize Number of actions required for one star; values below 1 are treated as 1.
 * @param starsPerRow Number of stars in one visual tier row; values below 1 are treated as 1.
 * @returns Derived counts, active tier, and current fractional star progress from 0 to less than 1.
 */
export function getStarProgressState(
  totalCount: number,
  chunkSize: number,
  starsPerRow: number,
): StarProgressState {
  const safeTotalCount = Math.max(0, Math.floor(totalCount));
  const safeChunkSize = Math.max(1, Math.floor(chunkSize));
  const safeStarsPerRow = Math.max(1, Math.floor(starsPerRow));
  const completedStars = getCompletedStarCount(safeTotalCount, safeChunkSize);
  const completedTiers = Math.floor(completedStars / safeStarsPerRow);
  const activeRowCompletedStars = completedStars % safeStarsPerRow;
  const currentChunkCount = getCurrentStarProgressCount(safeTotalCount, safeChunkSize);
  const activeStarProgress = currentChunkCount / safeChunkSize;

  return {
    totalCount: safeTotalCount,
    chunkSize: safeChunkSize,
    starsPerRow: safeStarsPerRow,
    completedStars,
    completedTiers,
    activeRowCompletedStars,
    activeStarProgress,
    activeTier: getStarTier(completedTiers),
    currentChunkCount,
  };
}
