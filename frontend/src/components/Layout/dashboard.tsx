import LessonBar from "@/components/UI/lesson-bar";
import { getLessonProgress } from "@/utils/dashboard.utils";
import type { LessonsLocal } from "@/types/local.types";
import { useUserStore } from "@/hooks/use-user";
import HelpButton from "@/components/UI/help-button";
import Hint from "@/components/UI/hint";
import { useOverlayStore } from "@/hooks/use-overlay-store";

export default function Dashboard() {
  const { userStats } = useUserStore();
  const { isOpen } = useOverlayStore();
  const lessonProgress: LessonsLocal[] = userStats
    ? getLessonProgress(
        userStats.learnedCount || 0,
        userStats.learnedCountToday || 0
      )
    : [];

  return (
    <div className="flex  w-full max-w-card mx-auto flex-col gap-1">
      {lessonProgress.map(({ lessonId, previousCount, todayCount }) => (
        <LessonBar
          key={lessonId}
          lessonNumber={lessonId}
          previousCount={previousCount}
          todayCount={todayCount}
        />
      ))}
      <Hint visibility={isOpen} style={{ bottom: "4px", right: "8px" }}>
        dnes naučeno
      </Hint>
      <HelpButton
        style={{
          bottom: "5px",
          left: "50px",
        }}
      />
    </div>
  );
}
