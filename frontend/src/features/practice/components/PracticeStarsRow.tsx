import { STAR_SIZE, StarRowWithFillingStar } from '@/components/UI/StarProgress';
import type { StarTier } from '@/utils/star-progress.utils';
import { type JSX } from 'react';

type PracticeStarsRowProps = Readonly<{
  starCount: number;
  displayedChunkCount: number;
  starChunk: number;
  starsPerRow: number;
  completedStarFlash: StarTier | null;
  size?: number;
}>;

export default function PracticeStarsRow({
  starCount,
  displayedChunkCount,
  starChunk,
  starsPerRow,
  completedStarFlash,
  size = STAR_SIZE,
}: PracticeStarsRowProps): JSX.Element {
  return (
    <span className="inline-flex items-center gap-2 self-center whitespace-nowrap">
      <StarRowWithFillingStar
        starCount={starCount}
        currentProgress={displayedChunkCount}
        maxProgress={starChunk}
        starsPerRow={starsPerRow}
        size={size}
      />
      <span
        className={`inline-block w-18 text-right tabular-nums transition-colors duration-200 ${
          completedStarFlash === 'bronze'
            ? 'font-bold text-[#B87333] dark:text-[#D8A373]'
            : completedStarFlash === 'silver'
              ? 'font-bold text-[#A8ADB7] dark:text-[#E5E7EB]'
              : completedStarFlash === 'gold'
                ? 'font-bold text-[#D4AF37] dark:text-[#FFD36B]'
                : ''
        }`}
      >
        {displayedChunkCount} / {starChunk}
      </span>
    </span>
  );
}
