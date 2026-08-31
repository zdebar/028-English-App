import { TEXTS, ARIA_TEXTS } from '@/locales/cs';
import { formatProgressChange } from '@/utils/format.utils';

type BlockBarProps = Readonly<{
  currentProgress: number;
  dailyProgressChange: number;
  lessonName: string;
  lessonNumber: number;
  maximumProgress: number;
  widthBase?: number;
  className?: string;
}>;

/**
 * BlockBar component displays a lesson's current effective progress and today's delta.
 *
 * @param currentProgress {number} Current effective progress in the lesson.
 * @param dailyProgressChange {number} Net progress change recorded today.
 * @param lessonName {string} The name of the current lesson block.
 * @param lessonNumber {number} The number of the lesson the block belongs to.
 * @param maximumProgress {number} Maximum effective progress in the lesson.
 * @param widthBase {number} Item count that maps to 100% width (default: 40).
 * @param className {string} Additional CSS classes for custom styling.
 * @returns A styled progress bar with labels and visual representation of progress.
 */
export default function BlockBar({ ...props }: BlockBarProps) {
  const {
    currentProgress,
    dailyProgressChange,
    lessonName,
    lessonNumber,
    maximumProgress,
    widthBase,
    className,
  } = { ...DEFAULT_BLOCK_BAR_PROPS, ...props };
  const safeLesson = Math.max(maximumProgress, 1);
  const safeWidthBase = Math.max(widthBase, 1);
  const visibleItems = Math.min(safeLesson, safeWidthBase);

  // Width is proportional up to widthBase; width is capped at 100%.
  const barWidth = (visibleItems / safeWidthBase) * 100;

  // Calculate progress widths
  const clampedCurrent = Math.min(Math.max(currentProgress, 0), safeLesson);
  const previousProgress = Math.max(currentProgress - Math.max(dailyProgressChange, 0), 0);
  const clampedPrevious = Math.min(previousProgress, safeLesson);
  const previousWidth = (clampedPrevious / safeLesson) * 100;
  const totalWidth = (clampedCurrent / safeLesson) * 100;

  return (
    <div className="h-attribute bg-block-bar-empty cursor-inherit relative w-full select-none">
      <div className="font-body text-light absolute -top-0.5 right-0 left-0 z-20 flex items-center justify-between truncate px-2 pt-1 text-center font-bold">
        <span
          title={`${TEXTS.lessonOrder} - ${TEXTS.lessonName} `}
          className="flex items-center gap-1"
        >
          <span className="inline-block min-w-6 text-right">{lessonNumber}</span>
          <span className="ml-1 min-w-0 truncate">{lessonName}</span>
        </span>
        <span className="font-headings" title={TEXTS.progressTodayHint}>
          {formatProgressChange(dailyProgressChange)}
        </span>
      </div>
      <div className={`relative h-full w-full ${className}`} style={{ width: `${barWidth}%` }}>
        {/* Native progress bar for accessibility */}
        <div
          className="bg-progress-bg relative block h-full w-full"
          role="progressbar"
          aria-valuenow={currentProgress}
          aria-valuemin={0}
          aria-valuemax={maximumProgress}
          aria-label={ARIA_TEXTS.lessonProgressBar}
        ></div>
        {/* Visual overlays for today/previous progress */}
        <div
          className="bg-new-progress-light dark:bg-new-progress-dark pointer-events-none absolute top-0 left-0 h-full"
          style={{ width: `${totalWidth}%` }}
        ></div>
        <div
          className="bg-old-progress-light dark:bg-old-progress-dark pointer-events-none absolute top-0 left-0 h-full"
          style={{ width: `${previousWidth}%` }}
        ></div>
      </div>
    </div>
  );
}

const DEFAULT_BLOCK_BAR_PROPS: Required<BlockBarProps> = {
  currentProgress: 0,
  dailyProgressChange: 0,
  lessonName: '',
  lessonNumber: 0,
  maximumProgress: 40,
  widthBase: 40,
  className: '',
};
