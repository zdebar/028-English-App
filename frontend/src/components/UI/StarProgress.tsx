import { useId, type JSX } from 'react';

import config from '@/config/config';
import StarIcon, { STAR_ICON_PATH } from '@/components/UI/icons/StarIcon';
import {
  getCompletedStarCount,
  getStarProgressState,
  getStarTier,
  type StarTier,
} from '@/utils/star-progress.utils';

const DEFAULT_DAILY_STAR_PROGRESS_LABEL = 'Daily star progress';

function getStarTierAriaLabel(tier: string, index: number, total: number): string {
  return `${tier} star ${index} of ${total}`;
}

function getDailyStarProgressLabel(): string {
  return DEFAULT_DAILY_STAR_PROGRESS_LABEL;
}

const EMPTY_STAR_BORDER_CLASS = 'star-empty-border';
const EMPTY_STAR_FILL_CLASS = 'star-empty-fill';
export const STAR_SIZE = 22;
const STAR_FILL_TOP = 4.5;
const STAR_FILL_BOTTOM = 20.54;
const STAR_FILL_HEIGHT = STAR_FILL_BOTTOM - STAR_FILL_TOP;

const TIER_STYLES: Record<StarTier, { fillClassName: string; badgeClassName: string }> = {
  bronze: {
    fillClassName: 'star-fill-bronze',
    badgeClassName: 'star-badge-bronze',
  },
  silver: {
    fillClassName: 'star-fill-silver',
    badgeClassName: 'star-badge-silver',
  },
  gold: {
    fillClassName: 'star-fill-gold',
    badgeClassName: 'star-badge-gold',
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
        <span className={`star-badge ${badgeClassName}`}>
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
  const tierCounts = [
    Math.min(safeStarCount, safeStarsPerRow),
    Math.min(Math.max(safeStarCount - safeStarsPerRow, 0), safeStarsPerRow),
    Math.max(safeStarCount - safeStarsPerRow * 2, 0),
  ];

  if (safeStarCount === 0) {
    return (
      <div className="z-star-stack relative flex flex-wrap items-center gap-3 overflow-visible" />
    );
  }

  return (
    <div className="z-star-stack relative flex flex-wrap items-center gap-3 overflow-visible">
      {tierCounts.map((count, index) => {
        if (count === 0) {
          return null;
        }

        const tier = getStarTier(index);
        const tierStyle = TIER_STYLES[tier];

        return (
          <CompactedStar
            key={`completed-tier-${tier}`}
            starClassName={tierStyle.fillClassName}
            badgeClassName={tierStyle.badgeClassName}
            count={count}
            size={size}
          />
        );
      })}
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
            aria-label={getStarTierAriaLabel(state.activeTier, index + 1, starsPerRow)}
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
    <div className="flex flex-col items-center gap-2" aria-label={getDailyStarProgressLabel()}>
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
