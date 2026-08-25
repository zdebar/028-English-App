import { TEXTS, ARIA_TEXTS } from '@/locales/cs';
import BlockBar from '@/components/UI/BlockBar';
import HelpText from '@/features/help/HelpText';
import { useUserStore } from '@/features/user-stats/use-user-store';
import { getInProgressLessons } from '@/utils/dashboard.utils';
import Notification from '@/components/UI/Notification';
import { DataNavigationLink } from '@/routing/data-navigation';
import { ROUTES } from '@/config/routes.config';
import { levelsDescriptor } from '@/routing/route-data';

type DashboardProps = Readonly<{
  userId: string;
  /** Extra classes appended to the dashboard section wrapper. */
  className?: string;
}>;

export default function Dashboard({ userId, className = '' }: DashboardProps) {
  const levelsOverview = useUserStore((state) => state.levels);
  const levelsLoading = useUserStore((state) => state.levelsLoading);
  const levels = Array.isArray(levelsOverview) ? levelsOverview : [];

  const lessonsInProgress = getInProgressLessons(levels);

  if (levelsLoading) {
    return (
      <section
        className={`min-w-card h-attribute relative mx-auto w-full ${className}`}
        aria-label={ARIA_TEXTS.dashboardRegion}
      />
    );
  }

  if (levels.length === 0) {
    return (
      <section
        className={`min-w-card h-attribute relative mx-auto w-full ${className}`}
        aria-label={ARIA_TEXTS.dashboardRegion}
      >
        <Notification>{TEXTS.noDashboardData}</Notification>
      </section>
    );
  }

  return (
    <DataNavigationLink
      to={ROUTES.levels}
      descriptor={levelsDescriptor(userId)}
      aria-label={TEXTS.levelsOverviewTooltip}
      title={TEXTS.levelsOverviewTooltip}
      className="block cursor-pointer hover:ring-1 hover:ring-current focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      <section
        className={`min-w-card relative flex w-full flex-col gap-1 ${className}`}
        aria-label={ARIA_TEXTS.dashboardRegion}
      >
        {lessonsInProgress.length === 0 ? (
          <Notification className="color-info">{TEXTS.levelsOverview}</Notification>
        ) : (
          <>
            {lessonsInProgress.map((lesson) => (
              <BlockBar
                key={lesson.id}
                lessonName={lesson.name ?? ''}
                lessonNumber={lesson.sort_order}
                previousCount={(lesson.startedCount ?? 0) - (lesson.startedTodayCount ?? 0)}
                todayCount={lesson.startedTodayCount ?? 0}
                lessonCount={lesson.totalCount ?? 1}
              />
            ))}
            <HelpText className="right-2 -bottom-6">{TEXTS.startedTodayHint}</HelpText>
          </>
        )}
      </section>
    </DataNavigationLink>
  );
}
