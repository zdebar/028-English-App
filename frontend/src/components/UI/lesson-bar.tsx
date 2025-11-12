import config from "@/config/config";

interface LessonBarProps {
  previousCount: number;
  todayCount: number;
  lessonNumber: number;
  divisions?: number;
}

export default function ProgressBar({
  previousCount = 0,
  todayCount = 0,
  lessonNumber = 1,
  divisions = 20,
}: LessonBarProps) {
  const lessonSize = config.lesson.lessonSize || 100;
  const totalWidth = 100;

  // Validace vstupních hodnot
  const validPreviousCount = Math.max(0, previousCount);
  const validTodayCount = Math.max(0, todayCount);

  // Výpočet šířek
  const previousWidth = (validPreviousCount / lessonSize) * totalWidth;
  const todayWidth = (validTodayCount / lessonSize) * totalWidth;

  return (
    <div className="relative mx-auto max-w-card w-full">
      {/* Popisky */}
      <div className="absolute top-0 left-0 w-full flex justify-between z-10 pt-1 px-2 font-body font-bold text-sm text-center text-light dark:text-dark">
        <span>Lekce: {lessonNumber}</span>
        <span>+ {validTodayCount}</span>
      </div>

      {/* Progress bar */}
      <div
        className="relative h-attribute overflow-hidden "
        role="progressbar"
        aria-valuenow={validPreviousCount + validTodayCount}
        aria-valuemin={0}
        aria-valuemax={lessonSize}
        aria-label={`Pokrok pro lekci ${lessonNumber}`}
      >
        {/* Celkový pokrok */}
        <div
          className="absolute top-0 left-0 h-full bg-[#F7D565] dark:bg-[#213563]"
          style={{ width: `${previousWidth + todayWidth}%` }}
        ></div>
        {/* Předchozí pokrok */}
        <div
          className="absolute top-0 left-0 h-full dark:bg-background-dark bg-background-light"
          style={{ width: `${previousWidth}%` }}
        ></div>
        {/* Dělení */}
        {Array.from({ length: divisions }, (_, index) => {
          const position = (index / divisions) * 100;
          return (
            <div
              key={index}
              className="absolute top-0 h-full border-l dark:border-gray-300 border-gray-700"
              style={{ left: `${position}%` }}
            ></div>
          );
        })}
      </div>
    </div>
  );
}
