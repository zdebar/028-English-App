import config from '@/config/config';
import {
  getCompletedStarCount,
  getCurrentStarProgressCount,
} from '@/utils/star-progress.utils';

type UsePracticeStarsResult = Readonly<{
  starChunk: number;
  starsPerRow: number;
  starCount: number;
  displayedChunkCount: number;
}>;

export function usePracticeStars(practiceCountToday: number): UsePracticeStarsResult {
  const starChunk = config.practice.starChunk;
  const starsPerRow = config.practice.starsPerRow;

  const starCount = getCompletedStarCount(practiceCountToday, starChunk);
  const displayedChunkCount = getCurrentStarProgressCount(practiceCountToday, starChunk);

  return {
    starChunk,
    starsPerRow,
    starCount,
    displayedChunkCount,
  };
}
