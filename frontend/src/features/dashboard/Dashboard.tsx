import { TEXTS, ARIA_TEXTS } from '@/locales/cs';
import BlockBar from '@/components/UI/BlockBar';
import HelpText from '@/features/help/HelpText';
import { useUserStore } from '@/features/user-stats/use-user-store';
import MasteredToggleButton from '@/features/progress/MasteredToggleButton';
import { getInProgressLessons } from '@/utils/dashboard.utils';
import Notification from '@/components/UI/Notification';

type DashboardProps = Readonly<{
  /** Extra classes appended to the dashboard section wrapper. */
  className?: string;
}>;

export default function Dashboard({ className = '' }: DashboardProps) {
  const levelsOverview = useUserStore((state) => state.levels);
  const levelsLoading = useUserStore((state) => state.levelsLoading);
  const showMastered = useUserStore((state) => state.showMasteredDashboard);
  const setShowMastered = useUserStore((state) => state.setMasteredDashboard);

  const lessonsInProgress = getInProgressLessons(
    Array.isArray(levelsOverview) ? levelsOverview : [],
    showMastered ? 'mastered' : 'started',
  );

  if (lessonsInProgress.length === 0) {
    return (
      <section
        className={`min-w-card h-attribute relative mx-auto w-full ${className}`}
        aria-label={ARIA_TEXTS.dashboardRegion}
      >
        {!levelsLoading && (
          <Notification className="color-info">{TEXTS.noDashboardData}</Notification>
        )}
      </section>
    );
  }

  return (
    <section
      className={`min-w-card relative mx-auto flex w-full flex-col gap-1 ${className}`}
      aria-label={ARIA_TEXTS.dashboardRegion}
    >
      {lessonsInProgress.map((lesson) => (
        <BlockBar
          key={lesson.id}
          lessonName={lesson.name ?? ''}
          lessonNumber={lesson.sort_order}
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
      <HelpText className="right-2 -bottom-6">
        {showMastered ? TEXTS.masteredTodayHint : TEXTS.startedTodayHint}
      </HelpText>
      <MasteredToggleButton
        showMastered={showMastered}
        setShowMastered={setShowMastered}
        className="pos-mastered-toggle"
      />
    </section>
  );
}
