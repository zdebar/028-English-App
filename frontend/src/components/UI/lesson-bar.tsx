import config from "@/config/config";

interface LessonBarProps {
  previousCount: number;
  todayCount: number;
  lessonNumber: number;
  divisions?: number;
  className?: string;
}

export default function ProgressBar({
  previousCount = 0,
  todayCount = 0,
  lessonNumber = 1,
  divisions = 20,
  className = "",
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
    <div className={`relative mx-auto w-full ${className}`}>
      {/* Popisky */}
      <div className="absolute top-0 left-0 w-full flex  justify-between z-10 pt-1 px-2 font-body font-bold text-sm text-center text-light">
        <span>Blok: {lessonNumber}</span>
        <span>+ {validTodayCount}</span>
      </div>

      {/* Progress bar */}
      <div
        className="relative h-attribute overflow-hidden bg-white"
        role="progressbar"
        aria-valuenow={validPreviousCount + validTodayCount}
        aria-valuemin={0}
        aria-valuemax={lessonSize}
        aria-label={`Pokrok pro lekci ${lessonNumber}`}
      >
        {/* Celkový pokrok */}
        <div
          className="absolute top-0 left-0 h-full bg-notice-dark dark:bg-[#F7D565]"
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
              className="absolute top-0 h-full border-l  border-gray-700"
              style={{ left: `${position}%` }}
            ></div>
          );
        })}
      </div>
    </div>
  );
}
