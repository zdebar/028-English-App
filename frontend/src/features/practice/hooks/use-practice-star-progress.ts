import { useEffect, useRef, useState } from 'react';

import config from '@/config/config';
import { getStarProgressState, getStarTier, type StarTier } from '@/utils/star-progress.utils';

export function usePracticeStarProgress(dailyCount: number) {
  const [completedStarFlash, setCompletedStarFlash] = useState<StarTier | null>(null);

  const starChunk = config.practice.starChunk;
  const starsPerRow = config.practice.starsPerRow;
  const starFlashDuration = config.practice.starFlashDuration;
  const starProgress = getStarProgressState(dailyCount, starChunk, starsPerRow);
  const displayedChunkCount =
    completedStarFlash && dailyCount > 0 && dailyCount % starChunk === 0
      ? starChunk
      : starProgress.currentChunkCount;
  const displayedStarProgress = starProgress.activeStarProgress;
  const lastAnimatedCompletedStarsRef = useRef(Math.floor(dailyCount / starChunk));

  useEffect(() => {
    const completedStars = starProgress.completedStars;
    const justCompletedChunk = dailyCount > 0 && dailyCount % starChunk === 0;

    if (justCompletedChunk && completedStars > lastAnimatedCompletedStarsRef.current) {
      setCompletedStarFlash(getStarTier(Math.floor((completedStars - 1) / starsPerRow)));
      lastAnimatedCompletedStarsRef.current = completedStars;
      const timeoutId = globalThis.setTimeout(() => {
        setCompletedStarFlash(null);
      }, starFlashDuration);

      return () => globalThis.clearTimeout(timeoutId);
    }

    lastAnimatedCompletedStarsRef.current = Math.max(
      lastAnimatedCompletedStarsRef.current,
      completedStars,
    );

    return undefined;
  }, [dailyCount, starChunk, starFlashDuration, starProgress.completedStars, starsPerRow]);

  return {
    starChunk,
    starsPerRow,
    starProgress,
    displayedChunkCount,
    displayedStarProgress,
    completedStarFlash,
  };
}
