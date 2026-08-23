import config from '@/config/config';

type UsePracticeStarsResult = Readonly<{
  starChunk: number;
  starsPerRow: number;
  starCount: number;
  displayedChunkCount: number;
}>;

export function usePracticeStars(
  dailyStarCount: number,
  sessionProgress: number = 0,
): UsePracticeStarsResult {
  const starChunk = config.practice.reviewStarSize;
  const starsPerRow = config.practice.starsPerRow;

  const starCount = dailyStarCount;
  const displayedChunkCount = sessionProgress;

  return {
    starChunk,
    starsPerRow,
    starCount,
    displayedChunkCount,
  };
}
