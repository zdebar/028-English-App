import LessonBar from "@/components/UI/lesson-bar";
import { getLessonProgress } from "@/utils/dashboard.utils";
import type { LessonsLocal } from "@/types/local.types";
import { useUserStore } from "@/hooks/use-user";
import HelpButton from "@/components/UI/help-button";
import Hint from "@/components/UI/hint";
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
          className="joyride-step-1"
        />
      ))}
      <Hint visibility={isOpen} style={{ bottom: "5px", right: "5px" }}>
        dnes naučeno
      </Hint>
      <HelpButton
        className="joyride-step-2"
        style={{
          bottom: "5px",
          left: "50px",
        }}
      />
    </div>
  );
}
