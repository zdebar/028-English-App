import LessonBar from "@/components/UI/lesson-bar";
import { getLessonProgress } from "@/utils/dashboard.utils";
import type { LessonsLocal } from "@/types/local.types";
import { useUserStore } from "@/hooks/use-user";

export default function Dashboard() {
  const { userStats } = useUserStore();
  const lessonProgress: LessonsLocal[] = userStats
    ? getLessonProgress(
        userStats.learnedCount || 0,
        userStats.learnedCountToday || 0
      )
    : [];

  return (
    <div className="flex  w-full flex-col gap-1">
      {lessonProgress.map(({ lessonId, previousCount, todayCount }) => (
        <LessonBar
          key={lessonId}
          lessonNumber={lessonId}
          previousCount={previousCount}
          todayCount={todayCount}
        />
      ))}
    </div>
  );
}
