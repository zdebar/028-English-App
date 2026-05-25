import { useEffect, useRef, useState } from 'react';

import config from '@/config/config';
import {
  getCompletedStarCount,
  getCurrentStarProgressCount,
  getStarTier,
  type StarTier,
} from '@/utils/star-progress.utils';

type UsePracticeStarsResult = Readonly<{
  starChunk: number;
  starsPerRow: number;
  starCount: number;
  displayedChunkCount: number;
  completedStarFlash: StarTier | null;
}>;

export function usePracticeStars(practiceCountToday: number): UsePracticeStarsResult {
  const [completedStarFlash, setCompletedStarFlash] = useState<StarTier | null>(null);

  const starChunk = config.practice.starChunk;
  const starsPerRow = config.practice.starsPerRow;
  const starFlashDuration = config.practice.starFlashDuration;

  const starCount = getCompletedStarCount(practiceCountToday, starChunk);
  const currentChunkCount = getCurrentStarProgressCount(practiceCountToday, starChunk);
  const displayedChunkCount =
    completedStarFlash && practiceCountToday > 0 && practiceCountToday % starChunk === 0
      ? starChunk
      : currentChunkCount;

  const lastAnimatedCompletedStarsRef = useRef(starCount);

  useEffect(() => {
    const justCompletedChunk = practiceCountToday > 0 && practiceCountToday % starChunk === 0;

    if (justCompletedChunk && starCount > lastAnimatedCompletedStarsRef.current) {
      setCompletedStarFlash(getStarTier(Math.floor((starCount - 1) / starsPerRow)));
      lastAnimatedCompletedStarsRef.current = starCount;
    }

    lastAnimatedCompletedStarsRef.current = Math.max(
      lastAnimatedCompletedStarsRef.current,
      starCount,
    );

    return undefined;
  }, [practiceCountToday, starChunk, starCount, starsPerRow]);

  useEffect(() => {
    if (!completedStarFlash) {
      return undefined;
    }

    const timeoutId = globalThis.setTimeout(() => {
      setCompletedStarFlash(null);
    }, starFlashDuration);

    return () => globalThis.clearTimeout(timeoutId);
  }, [completedStarFlash, starFlashDuration]);

  return {
    starChunk,
    starsPerRow,
    starCount,
    displayedChunkCount,
    completedStarFlash,
  };
}
