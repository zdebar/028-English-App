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

export function getStarTier(tierIndex: number): StarTier {
  if (tierIndex <= 0) return 'bronze';
  if (tierIndex === 1) return 'silver';
  return 'gold';
}

export function getCurrentStarProgressCount(totalCount: number, chunkSize: number): number {
  const safeTotalCount = Math.max(0, Math.floor(totalCount));
  const safeChunkSize = Math.max(1, Math.floor(chunkSize));

  return safeTotalCount % safeChunkSize;
}

export function getCompletedStarCount(totalCount: number, chunkSize: number): number {
  const safeTotalCount = Math.max(0, Math.floor(totalCount));
  const safeChunkSize = Math.max(1, Math.floor(chunkSize));

  return Math.floor(safeTotalCount / safeChunkSize);
}

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
