import { TEXTS } from '@/config/texts';
import LessonBar from '@/features/dashboard/BlockBar';
import { getLessonProgress } from '@/features/dashboard/dashboard.utils';
import { useUserStore } from '@/features/dashboard/use-user-store';
import HelpButton from '@/features/help/HelpButton';
import HelpText from '@/features/help/HelpText';
import type { LessonsLocal } from '@/types/local.types';

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

  const lessonProgress: LessonsLocal[] = userStats
    ? getLessonProgress(userStats.startedCount || 0, userStats.startedCountToday || 0)
    : [];

  return (
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
      <HelpText className="right-3.5 pt-7">{TEXTS.startedTodayHint}</HelpText>
      <HelpButton className="top-6.5 left-0" />
    </div>
  );
}
