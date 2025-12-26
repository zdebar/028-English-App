import LessonBar from "@/features/dashboard/BlockBar";
import { getLessonProgress } from "@/features/dashboard/dashboard.utils";
import type { LessonsLocal } from "@/types/local.types";
import { useUserStore } from "@/hooks/use-user-store";
import HelpButton from "@/components/UI/buttons/HelpButton";
import Hint from "@/components/UI/Hint";
import { useOverlayStore } from "@/hooks/use-overlay-store";

export default function Dashboard({ className = "" }: { className?: string }) {
  const { userStats } = useUserStore();
  const { isOpen } = useOverlayStore();
  const lessonProgress: LessonsLocal[] = userStats
    ? getLessonProgress(
        userStats.learnedCount || 0,
        userStats.learnedCountToday || 0
      )
    : [];

  return (
    <div
      className={`flex max-w-card w-full min-w-card relative mx-auto flex-col gap-1 ${className}`}
    >
      {lessonProgress.map(({ lessonId, previousCount, todayCount }) => (
        <LessonBar
          key={lessonId}
          lessonNumber={lessonId}
          previousCount={previousCount}
          todayCount={todayCount}
        />
      ))}
      <Hint visibility={isOpen} className="absolute right-0 top-8">
        dnes naučeno
      </Hint>
      <HelpButton className="absolute top-7 left-0" />
    </div>
  );
}
