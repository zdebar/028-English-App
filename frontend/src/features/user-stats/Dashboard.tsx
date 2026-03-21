import { TEXTS } from '@/locales/cs';
import BlockBar from '@/features/user-stats/BlockBar';
import { useUserStore } from './use-user-store';
import HelpButton from '@/features/help/HelpButton';
import HelpText from '@/features/help/HelpText';
import { useState } from 'react';
import { getInProgressLessons } from './dashboard.utils';
import TextButton from '@/components/UI/buttons/TextButton';
import type { LessonOverview } from '@/types/local.types';

type DashboardProps = {
  className?: string;
};

const noAvailableLesson: LessonOverview = {
  id: 0,
  name: TEXTS.notAvailable,
  note: '',
  sort_order: 0,
  level_id: 0,
  deleted_at: null,
  startedCount: 0,
  startedTodayCount: 0,
  masteredCount: 0,
  masteredTodayCount: 0,
  totalCount: 0,
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

  if (lessonsInProgress.length === 0) lessonsInProgress.push(noAvailableLesson);

  return (
    <div className={`min-w-card relative mx-auto mb-12 flex w-full flex-col gap-1 ${className}`}>
      {lessonsInProgress.map((lesson) => (
        <BlockBar
          key={lesson.id}
          lessonName={lesson.name ?? ''}
          levelName={levelsOverview.find((level) => level.id === lesson.level_id)?.name ?? ''}
          isMastered={showMastered}
          previousCount={
            showMastered
              ? (lesson.masteredCount ?? 0) - (lesson.masteredTodayCount ?? 0)
              : (lesson.startedCount ?? 0) - (lesson.startedTodayCount ?? 0)
          }
          todayCount={
            showMastered ? (lesson.masteredTodayCount ?? 0) : (lesson.startedTodayCount ?? 0)
          }
          lessonCount={lesson.totalCount ?? 1}
        />
      ))}
      <HelpButton className="right-0 -bottom-14.5" />
      <HelpText className="right-2 -bottom-6">
        {showMastered ? TEXTS.masteredTodayHint : TEXTS.startedTodayHint}
      </HelpText>
      <TextButton
        onClick={() => setShowMastered((current) => !current)}
        title={TEXTS.masteredSwitchHelp}
      >
        {showMastered ? TEXTS.masteredCount : TEXTS.startedCount}
      </TextButton>
      <HelpText className="-bottom-15 left-2">{TEXTS.masteredSwitchHelp}</HelpText>
    </div>
  );
}
