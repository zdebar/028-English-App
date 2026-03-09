import { TEXTS } from '@/locales/cs';

interface BlockBarProps {
  previousCount: number;
  todayCount: number;
  lessonName: string;
  levelName: string;
  isMastered: boolean;
  divisions?: number;
  lessonCount: number;
  maxCount?: number;
  className?: string;
}

/**
 * BlockBar component displays a progress bar for a lesson block, showing previous and today's progress.
 *
 * @param previousCount {number} Number of items completed in previous sessions.
 * @param todayCount {number} Number of items completed today.
 * @param lessonName {string} The name of the current lesson block.
 * @param levelName {string} The name of the level the lesson belongs to.
 * @param isMastered {boolean} Indicates if the items count is mastered or started.
 * @param divisions {number} Distance of divisions in the progress bar (default: 5).
 * @param lessonCount {number} Total number of items in the lesson (default: 100).
 * @param maxCount {number} Maximal total count of all lessons (default: 100).
 * @param className {string} Additional CSS classes for custom styling.
 * @returns A styled progress bar with labels and visual representation of progress.
 */
export default function BlockBar({
  previousCount = 0,
  todayCount = 0,
  lessonName = '',
  levelName = '',
  isMastered = false,
  divisions = 5,
  lessonCount = 100,
  maxCount,
  className = '',
}: BlockBarProps) {
  // Ensure lessonCount is at least 1
  const safeLesson = Math.max(lessonCount, 1);
  // If maxCount is not provided, use safeLesson
  const safeTotal = typeof maxCount === 'number' ? Math.max(maxCount, safeLesson) : safeLesson;

  // Calculate bar width as percentage
  const barWidth = (safeLesson / safeTotal) * 100;

  // Calculate progress widths
  const previousWidth = safeLesson > 0 ? (previousCount / safeLesson) * barWidth : 0;
  const todayWidth = safeLesson > 0 ? (todayCount / safeLesson) * barWidth : 0;

  // Helper for rendering division lines
  const renderDivisions = () => {
    const stepPercent = Math.min(100, Math.max(1, divisions));
    const lineCount = Math.floor(barWidth / stepPercent) - 1;
    return Array.from({ length: lineCount }, (_, i) => {
      const position = (i + 1) * stepPercent;
      if (position > barWidth) return null;
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
    <div className="h-attribute relative w-full cursor-default select-none">
      <div className={`relative h-full w-full ${className}`} style={{ width: `${barWidth}%` }}>
        {/* Labels */}
        <div className="font-body text-light absolute -top-0.5 left-0 z-10 flex w-full items-center justify-between truncate px-4 pt-1 text-center font-bold">
          <span title={`${TEXTS.levelName} - ${TEXTS.lessonName} `}>
            {levelName} {lessonName}
          </span>
          <span title={isMastered ? TEXTS.masteredTodayHint : TEXTS.startedTodayHint}>
            + {todayCount}
          </span>
        </div>
        {/* Progress bar */}
        <div
          className="bg-progress-bg relative h-full overflow-hidden"
          role="progressbar"
          aria-valuenow={previousCount + todayCount}
          aria-valuemin={0}
          aria-valuemax={lessonCount}
        >
          {/* New progress */}
          <div
            className="bg-new-progress-light dark:bg-new-progress-dark absolute top-0 left-0 h-full"
            style={{ width: `${Math.min(previousWidth + todayWidth, 100)}%` }}
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
