import config from "@/config/config";

interface LessonBarProps {
  previousCount: number;
  todayCount: number;
  lessonNumber: number;
  divisions?: number;
}

export default function ProgressBar({
  previousCount,
  todayCount,
  lessonNumber,
  divisions = 20,
}: LessonBarProps) {
  const lessonSize = config.lesson.lessonSize;
  const totalWidth = 100;
  const previousWidth = (previousCount / lessonSize) * totalWidth;
  const todayWidth = (todayCount / lessonSize) * totalWidth;

  return (
    <div className="relative mx-auto max-w-card w-full">
      <div className="absolute top-0 left-0 w-full flex justify-between z-10 pt-1 px-2">
        <span className="text-bar">lekce: {lessonNumber}</span>
        <span className="text-bar">+ {todayCount}</span>
      </div>

      {/* Progress bar */}
      <div className="relative h-attribute bg-white overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-notice-dark"
          style={{ width: `${previousWidth + todayWidth}%` }}
          // style={{ width: `80%` }}
        ></div>
        <div
          className="absolute top-0 left-0 h-full bg-background-dark"
          // style={{ width: `20%` }}
          style={{ width: `${previousWidth}%` }}
        ></div>
        {[...Array(divisions)].map((_, index) => {
          const position = (index / divisions) * 100;
          return (
            <div
              key={index}
              className="absolute top-0 h-full border-l border-gray-400"
              style={{ left: `${position}%` }}
            ></div>
          );
        })}
      </div>
    </div>
  );
}
