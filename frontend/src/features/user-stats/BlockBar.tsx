import { TEXTS } from '@/locales/cs';

interface BlockBarProps {
  previousCount: number;
  todayCount: number;
  lessonName: string;
  lessonNumber: number;
  isMastered: boolean;
  divisions?: number;
  lessonCount: number;
  widthBase?: number;
  className?: string;
}

/**
 * BlockBar component displays a progress bar for a lesson block, showing previous and today's progress.
 *
 * @param previousCount {number} Number of items completed in previous sessions.
 * @param todayCount {number} Number of items completed today.
 * @param lessonName {string} The name of the current lesson block.
 * @param lessonNumber {number} The number of the lesson the block belongs to.
 * @param isMastered {boolean} Indicates if the items count is mastered or started.
 * @param divisions {number} Division step in item count (default: 10).
 * @param lessonCount {number} Total number of items in the lesson (default: 40).
 * @param widthBase {number} Item count that maps to 100% width (default: 40).
 * @param className {string} Additional CSS classes for custom styling.
 * @returns A styled progress bar with labels and visual representation of progress.
 */
export default function BlockBar({
  previousCount = 0,
  todayCount = 0,
  lessonName = '',
  lessonNumber = 0,
  isMastered = false,
  divisions = 10,
  lessonCount = 40,
  widthBase = 40,
  className = '',
}: BlockBarProps) {
  // Ensure lessonCount is at least 1
  const safeLesson = Math.max(lessonCount, 1);
  const safeWidthBase = Math.max(widthBase, 1);
  const visibleItems = Math.min(safeLesson, safeWidthBase);

  // Width is proportional up to widthBase; width is capped at 100%.
  const barWidth = (visibleItems / safeWidthBase) * 100;

  // Calculate progress widths
  const clampedPrevious = Math.min(Math.max(previousCount, 0), safeLesson);
  const clampedTotal = Math.min(Math.max(previousCount + todayCount, 0), safeLesson);
  const previousWidth = safeLesson > 0 ? (clampedPrevious / safeLesson) * 100 : 0;
  const totalWidth = safeLesson > 0 ? (clampedTotal / safeLesson) * 100 : 0;

  // Render divisions every N items (not percent).
  const renderDivisions = () => {
    const stepItems = Math.max(1, Math.floor(divisions));
    const positions: number[] = [];

    for (let item = stepItems; item < visibleItems; item += stepItems) {
      positions.push((item / safeWidthBase) * 100);
    }

    return positions.map((position) => {
      return (
        <div
          key={position}
          className="border-divisions absolute top-0 z-15 h-full border-l"
          style={{ left: `${position}%` }}
        ></div>
      );
    });
  };

  return (
    <div className="h-attribute relative w-full cursor-default bg-gray-200 select-none" >
      <div className="font-body text-light absolute -top-0.5 right-0 left-0 z-20 flex items-center justify-between truncate px-4 pt-1 text-center font-bold">
        <span title={`${TEXTS.levelName} - ${TEXTS.lessonName} `}>
          {lessonNumber} : {lessonName}
        </span>
        <span title={isMastered ? TEXTS.masteredTodayHint : TEXTS.startedTodayHint}>
          + {todayCount}
        </span>
      </div>
      <div className={`relative h-full w-full ${className}`} style={{ width: `${barWidth}%` }}>
        {/* Progress bar */}
        <div
          className="bg-progress-bg relative h-full overflow-hidden"
          role="progressbar"
          aria-label='Ukazatel pokroku lekcí'
          aria-valuenow={previousCount + todayCount}
          aria-valuemin={0}
          aria-valuemax={lessonCount}
        >
          {/* New progress */}
          <div
            className="bg-new-progress-light dark:bg-new-progress-dark absolute top-0 left-0 h-full"
            style={{ width: `${totalWidth}%` }}
          ></div>
          {/* Previous progress */}
          <div
            className="bg-old-progress-light dark:bg-old-progress-dark absolute top-0 left-0 h-full"
            style={{ width: `${previousWidth}%` }}
          ></div>
        </div>
      </div>
      {/* Divisions */}
      {renderDivisions()}
    </div>
  );
}
