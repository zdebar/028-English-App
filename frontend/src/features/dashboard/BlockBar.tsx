import config from '@/config/config';

interface BlockBarProps {
  previousCount: number;
  todayCount: number;
  lessonNumber: number;
  divisions?: number;
  className?: string;
}

/**
 * BlockBar component displays a progress bar for a lesson block, showing previous and today's progress.
 *
 * @param previousCount Number of items completed in previous sessions.
 * @param todayCount Number of items completed today.
 * @param lessonNumber The current lesson block number.
 * @param divisions Number of divisions (grid lines) in the progress bar (default: 20).
 * @param className Additional CSS classes for custom styling.
 * @returns A styled progress bar with labels and visual representation of progress.
 */
export default function BlockBar({
  previousCount = 0,
  todayCount = 0,
  lessonNumber = 1,
  divisions = 20,
  className = '',
}: BlockBarProps) {
  const lessonSize = config.lesson.lessonSize || 100;
  const totalWidth = 100;

  // Validace vstupních hodnot
  const validPreviousCount = Math.max(0, previousCount);
  const validTodayCount = Math.max(0, todayCount);

  // Výpočet šířek
  const previousWidth = (validPreviousCount / lessonSize) * totalWidth;
  const todayWidth = (validTodayCount / lessonSize) * totalWidth;

  return (
    <div className={`relative mx-auto w-full ${className}`}>
      {/* Popisky */}
      <div className="font-body text-light absolute top-0 left-0 z-10 flex w-full justify-between px-2 pt-1 text-center text-sm font-bold">
        <span>
          Blok: {lessonNumber} / {config.progress.maxBlockCount}
        </span>
        <span>+ {validTodayCount}</span>
      </div>

      {/* Progress bar */}
      <div
        className="h-attribute relative overflow-hidden bg-white"
        role="progressbar"
        aria-valuenow={validPreviousCount + validTodayCount}
        aria-valuemin={0}
        aria-valuemax={lessonSize}
        aria-label={`Pokrok pro lekci ${lessonNumber}`}
      >
        {/* Celkový pokrok */}
        <div
          className="bg-notice-dark absolute top-0 left-0 h-full dark:bg-[#F7D565]"
          style={{ width: `${previousWidth + todayWidth}%` }}
        ></div>
        {/* Předchozí pokrok */}
        <div
          className="absolute top-0 left-0 h-full bg-[#42BDDB] dark:bg-[#F7AE25]"
          style={{ width: `${previousWidth}%` }}
        ></div>
        {/* Dělení */}
        {Array.from({ length: divisions }, (_, index) => {
          const position = (index / divisions) * 100;
          return (
            <div
              key={index}
              className="absolute top-0 h-full border-l border-gray-700"
              style={{ left: `${position}%` }}
            ></div>
          );
        })}
      </div>
    </div>
  );
}
