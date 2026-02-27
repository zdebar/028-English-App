import { TEXTS } from '@/locales/cs';
import BlockBar from '@/features/dashboard/BlockBar';
import { useUserStore } from './use-user-store';
import HelpButton from '@/features/help/HelpButton';
import HelpText from '@/features/help/HelpText';
import { useState } from 'react';
import { getInProgressLessons } from './dashboard.utils';

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
  const [mastered, setMastered] = useState(false);
  const levelsOverview = useUserStore((state) => state.userStats?.levelsOverview);

  const lessonsInProgress = getInProgressLessons(
    Array.isArray(levelsOverview) ? levelsOverview : [],
    mastered ? 'mastered' : 'started',
  );
  const maxTotalCount =
    lessonsInProgress.length > 0
      ? Math.max(...lessonsInProgress.map((lesson) => lesson.totalCount), 1)
      : 1;

  return (
    <div className={`min-w-card relative mx-auto mb-12 flex w-full flex-col gap-1 ${className}`}>
      {lessonsInProgress.map((lesson) => (
        <BlockBar
          key={lesson.lesson_id}
          lessonName={lesson.lesson_name ?? ''}
          levelName={lesson.level_name ?? ''}
          previousCount={
            mastered
              ? (lesson.masteredCount ?? 0) - (lesson.masteredTodayCount ?? 0)
              : (lesson.startedCount ?? 0) - (lesson.startedTodayCount ?? 0)
          }
          todayCount={mastered ? (lesson.masteredTodayCount ?? 0) : (lesson.startedTodayCount ?? 0)}
          lessonCount={lesson.totalCount ?? 1}
          maxCount={maxTotalCount}
        />
      ))}
      <HelpButton className="right-0 -bottom-14.5" />
      <HelpText className="right-0 -bottom-6">
        {mastered ? TEXTS.masteredTodayHint : TEXTS.startedTodayHint}
      </HelpText>
      <button
        className="notification absolute -bottom-9 left-4"
        onClick={() => setMastered(!mastered)}
      >
        {mastered ? TEXTS.masteredCount : TEXTS.startedCount}
      </button>
      <HelpText className="-bottom-15 left-2">{TEXTS.masteredSwitchHelp}</HelpText>
    </div>
  );
}
