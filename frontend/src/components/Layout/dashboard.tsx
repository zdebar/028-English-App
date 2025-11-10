import LessonBar from "@/components/UI/lesson-bar";
import { getLessonProgress } from "@/utils/dashboard.utils";
import type { LessonProgress } from "@/types/local.types";
import { useUserStore } from "@/hooks/use-user";

export default function Dashboard() {
  const { userStats } = useUserStore();
  const lessonProgress: LessonProgress[] = getLessonProgress(
    userStats?.learnedCount || 0,
    userStats?.learnedCountToday || 0
  );

  return (
    <div className="flex h-input w-full flex-col gap-1">
      {lessonProgress.length > 0 ? (
        lessonProgress.map(([lessonNumber, previousCount, todayCount]) => (
          <LessonBar
            key={lessonNumber}
            lessonNumber={lessonNumber}
            previousCount={previousCount}
            todayCount={todayCount}
          />
        ))
      ) : (
        <p className="text-center">Žádný pokrok k zobrazení.</p>
      )}
    </div>
  );
}
