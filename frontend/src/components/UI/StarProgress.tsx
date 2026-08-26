import type { JSX } from 'react';

import config from '@/config/config';
import StarIcon from '@/components/UI/icons/StarIcon';
import { getCompletedStarCount, type StarTier } from '@/utils/star-progress.utils';

const DAILY_STAR_PROGRESS_LABEL = 'Daily star progress';

const EMPTY_STAR_BORDER_CLASS = 'star-empty-border';
export const STAR_SIZE = 22;

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

function EmptyStar({ className = '', size = STAR_SIZE }: StarProps): JSX.Element {
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center ${className}`.trim()}
      style={{ width: size, height: size }}
    >
      <StarIcon
        className={EMPTY_STAR_BORDER_CLASS}
        size={size}
        fillColor="transparent"
        strokeColor="currentColor"
        strokeWidth={1.25}
      />
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
    <span className="relative inline-flex items-center justify-center overflow-visible">
      <FullStar className={starClassName} size={size} />
      {showCount && <span className={`star-badge z-star-badge ${badgeClassName}`}>{count}</span>}
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
  const tierCounts: Array<Readonly<{ tier: StarTier; count: number }>> = [
    { tier: 'bronze', count: Math.min(safeStarCount, safeStarsPerRow) },
    {
      tier: 'silver',
      count: Math.min(Math.max(safeStarCount - safeStarsPerRow, 0), safeStarsPerRow),
    },
    { tier: 'gold', count: Math.max(safeStarCount - safeStarsPerRow * 2, 0) },
  ];
  tierCounts.reverse();

  if (safeStarCount === 0) {
    return (
      <div className="relative flex flex-wrap items-center gap-0 overflow-visible">
        <EmptyStar size={size} />
      </div>
    );
  }

  return (
    <div className="relative flex flex-wrap items-center gap-0 overflow-visible">
      {tierCounts.map(({ tier, count }) => {
        if (count === 0) {
          return null;
        }

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
  const completedStarCount = getCompletedStarCount(count, chunkSize);

  return (
    <div
      className="flex flex-col items-center justify-center gap-2"
      aria-label={DAILY_STAR_PROGRESS_LABEL}
    >
      <StarRow starCount={completedStarCount} starsPerRow={starsPerRow} size={STAR_SIZE} />
    </div>
  );
}
