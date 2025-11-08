import LessonBar from "@/components/lesson-bar";
import { getLessonProgress } from "@/utils/dashboard.utils";

interface DashboardProps {
  allCount: number;
  todayCount: number;
}

export default function Dashboard({ allCount, todayCount }: DashboardProps) {
  const lessonProgress = getLessonProgress(allCount, todayCount);
  console.log("Lesson Progress:", lessonProgress);
  return (
    <div className="flex h-input w-full flex-col gap-1">
      {lessonProgress.map(
        ([lessonNumber, previousCount, todayCount], index) => (
          <LessonBar
            key={index}
            lessonNumber={lessonNumber}
            previousCount={previousCount}
            todayCount={todayCount}
          />
        )
      )}
    </div>
  );
}
