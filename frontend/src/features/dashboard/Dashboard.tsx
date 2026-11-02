import Notification from '@/components/UI/Notification';
import HelpText from '@/features/help/HelpText';
import { ARIA_TEXTS, TEXTS } from '@/locales/cs';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { useDataManager } from '@/database/state/data-store';
import { selectLevelOverview } from '@/database/state/data-selectors';
import type { DataManagerState } from '@/database/state/data-types';
import { useMemo } from 'react';

type DashboardProps = Readonly<{
  className?: string;
}>;

export default function Dashboard({ className = '' }: DashboardProps) {
  const userId = useAuthStore((state) => state.userId);
  const dataState = useDataManager((state) => state);
  const levels = useMemo(
    () => userId ? selectLevelOverview(dataState, userId, dataState.localDate) : [],
    [dataState, userId],
  );
  const { levelsLoading, levelsError } = getDashboardDataStatus(dataState, userId);
  const visibleLevels = levels.filter((level) => level.lessons.length > 0);

  if (levelsLoading) {
    return (
      <section
        className={`min-w-card h-attribute mx-auto w-full ${className}`}
        aria-label={ARIA_TEXTS.dashboardRegion}
        aria-busy={levelsLoading}
      />
    );
  }

  if (shouldShowEmptyState(levelsError, visibleLevels.length)) {
    return (
      <section
        className={`min-w-card relative mx-auto w-full ${className}`}
        aria-label={ARIA_TEXTS.dashboardRegion}
      >
        <Notification>
          {levelsError ? TEXTS.dashboardLoadError : TEXTS.noDashboardData}
        </Notification>
      </section>
    );
  }

  return (
    <section
      className={`min-w-card relative mx-auto flex w-full flex-row gap-0.5 ${className}`}
      aria-label={ARIA_TEXTS.dashboardRegion}
    >
      <HelpText className="-top-7 right-0">{TEXTS.lessonOverview}</HelpText>
      {visibleLevels.map((level) => <DashboardLevel key={level.id} level={level} />)}
    </section>
  );
}

function DashboardLevel({ level }: Readonly<{ level: ReturnType<typeof selectLevelOverview>[number] }>) {
  return (
    <div
      className="relative flex h-8 min-w-8 border border-disabled-light border-dashed dark:border-disabled-dark"
      style={{ flexGrow: level.lessons.length, flexBasis: 0 }}
      title={`${level.name}: ${level.lessons.length}`}
    >
      <ul aria-label={level.name} className="m-0 flex w-full list-none p-0">
        {level.lessons.map((lesson) => (
          <DashboardLesson key={lesson.id} levelName={level.name} lesson={lesson} />
        ))}
      </ul>
      <span className="absolute inset-0 flex items-center justify-center font-bold">
        {level.name}
      </span>
    </div>
  );
}

function DashboardLesson({
  levelName,
  lesson,
}: Readonly<{ levelName: string; lesson: ReturnType<typeof selectLevelOverview>[number]['lessons'][number] }>) {
  const stateLabel = lesson.isStarted ? TEXTS.lessonStarted : TEXTS.lessonNotStarted;
  const label = `${levelName}, ${TEXTS.lessonOrder} ${lesson.sort_order}, ${lesson.name}: ${stateLabel}`;
  const fillClass = lesson.isStarted
    ? 'bg-old-progress-light dark:bg-old-progress-dark'
    : 'bg-transparent';

  return (
    <li title={label} className={`mb-0 h-full min-w-0 flex-1 ${fillClass}`}>
      <span className="sr-only">{label}</span>
    </li>
  );
}

function getDashboardDataStatus(
  dataState: DataManagerState,
  userId: string | null,
): Readonly<{ levelsLoading: boolean; levelsError: Error | null }> {
  const isActiveUser = dataState.userId === userId;
  return {
    levelsLoading: Boolean(userId) && (!isActiveUser || dataState.status === 'loading' || dataState.status === 'idle'),
    levelsError: isActiveUser && dataState.status === 'error' ? dataState.error : null,
  };
}

function shouldShowEmptyState(error: Error | null, visibleLevelCount: number): boolean {
  return error !== null || visibleLevelCount === 0;
}
