import { useId, type JSX } from 'react';

import StarIcon, { STAR_ICON_PATH } from '@/components/UI/icons/StarIcon';
import { getStarProgressState, getStarTier, type StarTier } from '@/utils/star-progress.utils';

const EMPTY_STAR_BORDER_CLASS = 'text-slate-600 dark:text-slate-500';
const EMPTY_STAR_FILL_CLASS = 'text-slate-300 dark:text-slate-700';
export const STAR_SIZE = 22;
const STAR_FILL_TOP = 3.5;
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
  progress: number;
  tier: StarTier;
  size?: number;
  className?: string;
  label?: string;
}>;

export function Star({ progress, tier, size = 22, className = '', label }: StarProps): JSX.Element {
  const maskId = useId();
  const safeProgress = Math.max(0, Math.min(1, progress));
  const tierStyle = TIER_STYLES[tier];
  const isComplete = safeProgress >= 1;
  const fillHeight = safeProgress <= 0 ? 0 : STAR_FILL_HEIGHT * safeProgress;
  const fillY = STAR_FILL_BOTTOM - fillHeight;

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center ${className}`.trim()}
      style={{ width: size, height: size }}
      aria-label={label}
    >
      {isComplete ? (
        <StarIcon
          className={tierStyle.fillClassName}
          size={size}
          fillColor="currentColor"
          strokeColor="currentColor"
          strokeWidth={1.25}
        />
      ) : (
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
      )}
    </span>
  );
}

type CompactedStarProps = Readonly<{
  tier: StarTier;
  count: number;
  size?: number;
  zIndex?: number;
}>;

export function CompactedStar({
  tier,
  count,
  size = STAR_SIZE,
  zIndex,
}: CompactedStarProps): JSX.Element {
  const tierStyle = TIER_STYLES[tier];
  const showCount = count >= 2;

  return (
    <span
      className="relative z-30 inline-flex items-center justify-center overflow-visible"
      style={zIndex ? { zIndex } : undefined}
      aria-label={`${tier} tier complete`}
    >
      <Star progress={1} tier={tier} size={size} />
      {showCount && (
        <span
          className={`absolute -top-1 left-[15px] z-40 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none font-semibold shadow-sm ${tierStyle.badgeClassName}`}
        >
          {count}
        </span>
      )}
    </span>
  );
}

type StarRowProps = Readonly<{
  tier: StarTier;
  starsPerRow: number;
  completedStars: number;
  activeStarProgress: number;
  size?: number;
}>;

export function StarRow({
  tier,
  starsPerRow,
  completedStars,
  activeStarProgress,
  size = STAR_SIZE,
}: StarRowProps): JSX.Element {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1">
      {Array.from({ length: starsPerRow }, (_, index) => {
        const progress =
          index < completedStars ? 1 : index === completedStars ? activeStarProgress : 0;

        return (
          <Star
            key={`${tier}-${index}`}
            progress={progress}
            tier={tier}
            size={size}
            label={`${tier} star ${index + 1} of ${starsPerRow}`}
          />
        );
      })}
    </div>
  );
}

type CompactSummaryProps = Readonly<{
  fullTierCount: number;
  partialTierCount: number;
  partialTier?: StarTier;
  starsPerRow?: number;
  size?: number;
}>;

export function CompactSummary({
  fullTierCount,
  partialTierCount,
  partialTier,
  starsPerRow = 10,
  size = STAR_SIZE,
}: CompactSummaryProps): JSX.Element | null {
  if (fullTierCount <= 0 && partialTierCount <= 0) {
    return null;
  }

  const compactedStarCount = fullTierCount + (partialTier && partialTierCount > 0 ? 1 : 0);

  return (
    <div className="relative z-30 flex flex-wrap items-center gap-2 overflow-visible">
      {Array.from({ length: fullTierCount }, (_, index) => (
        <CompactedStar
          key={`completed-tier-${index}`}
          tier={getStarTier(index)}
          count={starsPerRow}
          size={size}
          zIndex={compactedStarCount - index}
        />
      ))}
      {partialTier && partialTierCount > 0 && (
        <CompactedStar tier={partialTier} count={partialTierCount} size={size} zIndex={1} />
      )}
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
  const showBronzeRow = state.completedTiers === 0;

  return (
    <div className="flex flex-col items-center gap-2" aria-label="Daily star progress">
      {showBronzeRow ? (
        <StarRow
          tier={state.activeTier}
          starsPerRow={starsPerRow}
          completedStars={state.activeRowCompletedStars}
          activeStarProgress={state.activeStarProgress}
        />
      ) : (
        <div className="isolate flex flex-wrap items-center justify-center gap-2 overflow-visible">
          <CompactSummary
            fullTierCount={state.completedTiers}
            partialTierCount={state.activeRowCompletedStars}
            partialTier={state.activeTier}
            starsPerRow={starsPerRow}
            size={STAR_SIZE}
          />
          <Star
            progress={state.activeStarProgress}
            tier={state.activeTier}
            size={STAR_SIZE}
            label={`${state.activeTier} current star`}
            className="relative z-0"
          />
        </div>
      )}
    </div>
  );
}
