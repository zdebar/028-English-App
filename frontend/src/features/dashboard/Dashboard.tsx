import LessonBar from '@/features/dashboard/BlockBar';
import { getLessonProgress } from '@/features/dashboard/dashboard.utils';
import type { LessonsLocal } from '@/types/local.types';
import { useUserStore } from '@/features/dashboard/use-user-store';
import HelpButton from '@/features/overlay/HelpButton';
import Hint from '@/components/UI/Hint';
import { useOverlayStore } from '@/features/overlay/use-overlay-store';

type DashboardProps = {
  className?: string;
};

/**
 * Dashboard component displaying the user's lesson progress and helpful UI elements.
 *
 * @param className Additional CSS classes for custom styling.
 * @returns The dashboard view with lesson progress, hints, and help overlay.
 */
export default function Dashboard({ className = '' }: DashboardProps) {
  const { userStats } = useUserStore();
  const { isOpen } = useOverlayStore();
  const lessonProgress: LessonsLocal[] = userStats
    ? getLessonProgress(userStats.startedCount || 0, userStats.startedCountToday || 0)
    : [];

  return (
    <div>
      <div
        className={`max-w-card min-w-card relative mx-auto flex w-full flex-col gap-1 ${className}`}
      >
        {lessonProgress.map(({ lessonId, previousCount, todayCount }) => (
          <LessonBar
            key={lessonId}
            lessonNumber={lessonId}
            previousCount={previousCount}
            todayCount={todayCount}
          />
        ))}
      </div>
      <Hint visible={isOpen} className="right-0 p-2">
        dnes započato
      </Hint>
      <HelpButton className="pt-2" />
    </div>
  );
}
