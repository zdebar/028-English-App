import { TEXTS, ARIA_TEXTS } from '@/locales/cs';
import BlockBar from '@/components/UI/BlockBar';
import { useUserStore } from '../../features/user-stats/use-user-store';
import HelpButton from '@/features/help/HelpButton';
import HelpText from '@/features/help/HelpText';
import { getInProgressLessons } from '../../utils/dashboard.utils';
import MasteredSwitchButton from '@/components/UI/buttons/MasteredSwitchButton';
import type { LessonOverviewType } from '@/types/generic.types';

type DashboardProps = Readonly<{
  className?: string;
}>;

const noAvailableLesson: LessonOverviewType = {
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
  const levelsOverview = useUserStore((state) => state.levels);
  const showMasteredDashboard = useUserStore((state) => state.showMasteredDashboard);
  const setMasteredDashboard = useUserStore((state) => state.setMasteredDashboard);

  const lessonsInProgress = getInProgressLessons(
    Array.isArray(levelsOverview) ? levelsOverview : [],
    showMasteredDashboard ? 'mastered' : 'started',
  );

  if (lessonsInProgress.length === 0) lessonsInProgress.push(noAvailableLesson);

  return (
    <section
      className={`min-w-card relative mx-auto mb-12 flex w-full flex-col gap-1 ${className}`}
      aria-label={ARIA_TEXTS.dashboardRegion}
    >
      {lessonsInProgress.map((lesson) => (
        <BlockBar
          key={lesson.id}
          lessonName={lesson.name ?? ''}
          lessonNumber={lesson.sort_order}
          isMastered={showMasteredDashboard}
          previousCount={
            showMasteredDashboard
              ? (lesson.masteredCount ?? 0) - (lesson.masteredTodayCount ?? 0)
              : (lesson.startedCount ?? 0) - (lesson.startedTodayCount ?? 0)
          }
          todayCount={
            showMasteredDashboard
              ? (lesson.masteredTodayCount ?? 0)
              : (lesson.startedTodayCount ?? 0)
          }
          lessonCount={lesson.totalCount ?? 1}
        />
      ))}
      <HelpButton className="right-0 -bottom-14.5" />
      <HelpText className="right-2 -bottom-6">
        {showMasteredDashboard ? TEXTS.masteredTodayHint : TEXTS.startedTodayHint}
      </HelpText>
      <MasteredSwitchButton
        onClick={() => setMasteredDashboard(!showMasteredDashboard)}
        title={TEXTS.masteredSwitchHelp}
      >
        {showMasteredDashboard ? TEXTS.masteredCount : TEXTS.startedCount}
      </MasteredSwitchButton>
      <HelpText className="-bottom-15 left-2">{TEXTS.masteredSwitchHelp}</HelpText>
    </section>
  );
}
