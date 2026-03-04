import { TEXTS } from '@/locales/cs';
import BlockBar from '@/features/user-stats/BlockBar';
import { useUserStore } from './use-user-store';
import HelpButton from '@/features/help/HelpButton';
import HelpText from '@/features/help/HelpText';
import { useState } from 'react';
import { getInProgressLessons } from './dashboard.utils';
import TextButton from '@/components/UI/buttons/TextButton';

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
  const [showMastered, setShowMastered] = useState(false);
  const levelsOverview = useUserStore((state) => state.levels);

  const lessonsInProgress = getInProgressLessons(
    Array.isArray(levelsOverview) ? levelsOverview : [],
    showMastered ? 'mastered' : 'started',
  );
  const maxTotalCount =
    lessonsInProgress.length > 0
      ? Math.max(...lessonsInProgress.map((lesson) => lesson.totalCount), 1)
      : 1;

  return (
    <div className={`min-w-card relative mx-auto mb-12 flex w-full flex-col gap-1 ${className}`}>
      {lessonsInProgress.map((lesson) => (
        <BlockBar
          key={lesson.id}
          lessonName={lesson.name ?? ''}
          levelName={levelsOverview.find((level) => level.id === lesson.level_id)?.name ?? ''}
          previousCount={
            showMastered
              ? (lesson.masteredCount ?? 0) - (lesson.masteredTodayCount ?? 0)
              : (lesson.startedCount ?? 0) - (lesson.startedTodayCount ?? 0)
          }
          todayCount={
            showMastered ? (lesson.masteredTodayCount ?? 0) : (lesson.startedTodayCount ?? 0)
          }
          lessonCount={lesson.totalCount ?? 1}
          maxCount={maxTotalCount}
        />
      ))}
      <HelpButton className="right-0 -bottom-14.5" />
      <HelpText className="right-2 -bottom-6">
        {showMastered ? TEXTS.masteredTodayHint : TEXTS.startedTodayHint}
      </HelpText>
      <TextButton onClick={() => setShowMastered((current) => !current)}>
        {showMastered ? TEXTS.masteredCount : TEXTS.startedCount}
      </TextButton>
      <HelpText className="-bottom-15 left-2">{TEXTS.masteredSwitchHelp}</HelpText>
    </div>
  );
}
