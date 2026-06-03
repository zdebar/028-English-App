import { useId, type JSX } from 'react';

import config from '@/config/config';
import StarIcon, { STAR_ICON_PATH } from '@/components/UI/icons/StarIcon';
import {
  getCompletedStarCount,
  getStarProgressState,
  getStarTier,
  type StarTier,
} from '@/features/practice-overview/star-progress.utils';

const EMPTY_STAR_BORDER_CLASS = 'text-slate-600 dark:text-slate-500';
const EMPTY_STAR_FILL_CLASS = 'text-slate-300 dark:text-slate-700';
export const STAR_SIZE = 22;
const STAR_FILL_TOP = 4.5;
const STAR_FILL_BOTTOM = 20.54;
const STAR_FILL_HEIGHT = STAR_FILL_BOTTOM - STAR_FILL_TOP;

const TIER_STYLES: Record<StarTier, { fillClassName: string; badgeClassName: string }> = {
  bronze: {
    fillClassName: 'text-[#B87333] dark:text-[#D8A373]',
    badgeClassName:
      'bg-[#F3E0D0] text-[#8C5224] dark:bg-[#6F4A2F] dark:text-[#F6D5B5] border border-current',
  },
  silver: {
    fillClassName: 'text-[#A8ADB7] dark:text-[#E5E7EB]',
    badgeClassName:
      'bg-[#EEF2F7] text-[#626B79] dark:bg-[#4B5563] dark:text-[#F8FAFC] border border-current',
  },
  gold: {
    fillClassName: 'text-[#D4AF37] dark:text-[#FFD36B]',
    badgeClassName:
      'bg-[#F8EDC2] text-[#9B6B00] dark:bg-[#7A5600] dark:text-[#FFF2B3] border border-current',
  },
};

type StarProps = Readonly<{
  className?: string;
  size?: number;
}>;

/**
 * FullStar component renders a fully filled star icon with customizable size and color.
 * @param className - CSS class for the star icon.
 * @param size - Size of the star icon.
 * @returns JSX.Element representing the full star.
 */
export function FullStar({ className = '', size = 22 }: StarProps): JSX.Element {
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center ${className}`.trim()}
      style={{ width: size, height: size }}
    >
      <StarIcon
        className={className}
        size={size}
        fillColor="currentColor"
        strokeColor="currentColor"
        strokeWidth={1.25}
      />
    </span>
  );
}

type FillingStarProps = Readonly<{
  className?: string;
  size?: number;
  currentProgress: number;
  maxProgress: number;
}>;

/**
 * FillingStar component renders a star icon that fills based on the current progress.
 * @param className - CSS class for the star icon.
 * @param size - Size of the star icon.
 * @param currentProgress - Current progress value.
 * @param maxProgress - Maximum progress value.
 * @returns JSX.Element representing the filling star.
 */
export function FillingStar({
  className = '',
  size = 22,
  currentProgress,
  maxProgress,
}: FillingStarProps): JSX.Element {
  const maskId = useId();
  const safeMaxProgress = Math.max(1, maxProgress);
  const relativeProgress = Math.max(0, Math.min(1, currentProgress / safeMaxProgress));
  const fillHeight = relativeProgress <= 0 ? 0 : STAR_FILL_HEIGHT * relativeProgress;
  const fillY = STAR_FILL_BOTTOM - fillHeight;

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center ${className}`.trim()}
      style={{ width: size, height: size }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        className="block overflow-visible"
        aria-hidden="true"
      >
        <defs>
          <clipPath id={maskId}>
            <path d={STAR_ICON_PATH} />
          </clipPath>
        </defs>
        {fillHeight > 0 && (
          <rect
            x="0"
            y={fillY}
            width="24"
            height={fillHeight}
            clipPath={`url(#${maskId})`}
            className={EMPTY_STAR_FILL_CLASS}
            fill="currentColor"
          />
        )}
        <path
          d={STAR_ICON_PATH}
          className={EMPTY_STAR_BORDER_CLASS}
          fill="transparent"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

type CompactedStarProps = Readonly<{
  starClassName: string;
  badgeClassName: string;
  count: number;
  size?: number;
}>;

/**
 * CompactedStar component renders a star icon with a badge indicating the count.
 * @param starClassName - CSS class for the star icon.
 * @param badgeClassName - CSS class for the badge.
 * @param count - Number to display in the badge.
 * @param size - Size of the star icon.
 * @returns JSX.Element representing the compacted star.
 */
export function CompactedStar({
  starClassName,
  badgeClassName,
  count,
  size = STAR_SIZE,
}: CompactedStarProps): JSX.Element {
  const showCount = count >= 2;

  return (
    <span className="z-star-stack relative inline-flex items-center justify-center overflow-visible">
      <FullStar className={starClassName} size={size} />
      {showCount && (
        <span
          className={`z-star-badge absolute -top-1 left-[15px] inline-flex min-h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none font-semibold shadow-sm ${badgeClassName}`}
        >
          {count}
        </span>
      )}
    </span>
  );
}

type StarRowProps = Readonly<{
  starCount: number;
  starsPerRow?: number;
  size?: number;
}>;

export function StarRow({
  starCount,
  starsPerRow = config.practice.starsPerRow,
  size = STAR_SIZE,
}: StarRowProps): JSX.Element {
  const safeStarsPerRow = Math.max(1, Math.floor(starsPerRow));
  const safeStarCount = Math.max(0, Math.floor(starCount));
  const fullTierCount = Math.floor(safeStarCount / safeStarsPerRow);
  const partialTierCount = safeStarCount % safeStarsPerRow;

  if (safeStarCount === 0) {
    return (
      <div className="z-star-stack relative flex flex-wrap items-center gap-2 overflow-visible" />
    );
  }

  return (
    <div className="z-star-stack relative flex flex-wrap items-center gap-2 overflow-visible">
      {Array.from({ length: fullTierCount }, (_, index) => {
        const tier = getStarTier(index);
        const tierStyle = TIER_STYLES[tier];

        return (
          <CompactedStar
            key={`completed-tier-${index}`}
            starClassName={tierStyle.fillClassName}
            badgeClassName={tierStyle.badgeClassName}
            count={safeStarsPerRow}
            size={size}
          />
        );
      })}
      {partialTierCount > 0 &&
        (() => {
          const tierStyle = TIER_STYLES[getStarTier(fullTierCount)];

          return (
            <CompactedStar
              starClassName={tierStyle.fillClassName}
              badgeClassName={tierStyle.badgeClassName}
              count={partialTierCount}
              size={size}
            />
          );
        })()}
    </div>
  );
}

type StarRowWithFillingStarProps = Readonly<{
  starCount: number;
  currentProgress: number;
  maxProgress: number;
  starsPerRow?: number;
  size?: number;
  className?: string;
}>;

export function StarRowWithFillingStar({
  starCount,
  currentProgress,
  maxProgress,
  starsPerRow = config.practice.starsPerRow,
  size = STAR_SIZE,
  className = '',
}: StarRowWithFillingStarProps): JSX.Element {
  return (
    <div
      className={`isolate flex flex-wrap items-center justify-center gap-2 overflow-visible ${className}`.trim()}
    >
      <StarRow starCount={starCount} starsPerRow={starsPerRow} size={size} />
      <FillingStar
        currentProgress={currentProgress}
        maxProgress={maxProgress}
        size={size}
        className="z-star-current relative"
      />
    </div>
  );
}

type CompactSummaryProps = Readonly<{
  fullTierCount: number;
  partialTierCount: number;
  starsPerRow?: number;
  size?: number;
}>;

export function CompactSummary({
  fullTierCount,
  partialTierCount,
  starsPerRow = config.practice.starsPerRow,
  size = STAR_SIZE,
}: CompactSummaryProps): JSX.Element {
  return (
    <StarRow
      starCount={fullTierCount * starsPerRow + partialTierCount}
      starsPerRow={starsPerRow}
      size={size}
    />
  );
}

type DetailedStarTierRowProps = Readonly<{
  count: number;
  countPerStar?: number;
  starsPerRow?: number;
  size?: number;
}>;

function DetailedStarTierRow({
  count,
  countPerStar = config.practice.starChunk,
  starsPerRow = config.practice.starsPerRow,
  size = STAR_SIZE,
}: DetailedStarTierRowProps): JSX.Element {
  const state = getStarProgressState(count, countPerStar, starsPerRow);
  const tierStyle = TIER_STYLES[state.activeTier];

  return (
    <div className="flex flex-wrap items-center justify-center gap-1">
      {Array.from({ length: starsPerRow }, (_, index) => {
        const isFilledStar = index < state.activeRowCompletedStars;
        const isActiveStar = index === state.activeRowCompletedStars && state.currentChunkCount > 0;

        return (
          <span
            key={`${state.activeTier}-${index}`}
            aria-label={`${state.activeTier} star ${index + 1} of ${starsPerRow}`}
          >
            {isFilledStar ? (
              <FullStar className={tierStyle.fillClassName} size={size} />
            ) : (
              <FillingStar
                size={size}
                currentProgress={isActiveStar ? state.currentChunkCount : 0}
                maxProgress={state.chunkSize}
              />
            )}
          </span>
        );
      })}
    </div>
  );
}

type StarProgressOverviewProps = Readonly<{
  count: number;
  chunkSize: number;
  starsPerRow: number;
}>;

export default function StarProgressOverview({
  count,
  chunkSize,
  starsPerRow,
}: StarProgressOverviewProps): JSX.Element {
  const state = getStarProgressState(count, chunkSize, starsPerRow);
  const completedStarCount = getCompletedStarCount(count, chunkSize);
  const showBronzeRow = state.completedTiers === 0;

  return (
    <div className="flex flex-col items-center gap-2" aria-label="Daily star progress">
      {showBronzeRow ? (
        <DetailedStarTierRow count={count} countPerStar={chunkSize} starsPerRow={starsPerRow} />
      ) : (
        <StarRowWithFillingStar
          starCount={completedStarCount}
          currentProgress={state.currentChunkCount}
          maxProgress={state.chunkSize}
          starsPerRow={starsPerRow}
          size={STAR_SIZE}
        />
      )}
    </div>
  );
}
