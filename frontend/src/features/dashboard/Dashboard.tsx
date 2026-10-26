import Notification from '@/components/UI/Notification';
import HelpText from '@/features/help/HelpText';
import { useUserStore } from '@/features/user-stats/use-user-store';
import { ARIA_TEXTS, TEXTS } from '@/locales/cs';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { useUserStoreSync } from '@/features/user-stats/use-user-store-sync';

type DashboardProps = Readonly<{
  className?: string;
}>;

export default function Dashboard({ className = '' }: DashboardProps) {
  useUserStoreSync(useAuthStore((state) => state.userId));
  const levels = useUserStore((state) => state.levels);
  const levelsLoading = useUserStore((state) => state.levelsLoading);

  if (levelsLoading) {
    return (
      <section
        className={`min-w-card h-attribute mx-auto w-full ${className}`}
        aria-label={ARIA_TEXTS.dashboardRegion}
      />
    );
  }

  if (levels.length === 0) {
    return (
      <section
        className={`min-w-card relative mx-auto w-full ${className}`}
        aria-label={ARIA_TEXTS.dashboardRegion}
      >
        <Notification>{TEXTS.noDashboardData}</Notification>
      </section>
    );
  }

  return (
    <section
      className={`min-w-card relative mx-auto flex w-full flex-row gap-0.5 ${className}`}
      aria-label={ARIA_TEXTS.dashboardRegion}
    >
      <HelpText className="-top-7 right-0">{TEXTS.lessonOverview}</HelpText>
      {levels
        .filter((level) => level.lessons.length > 0)
        .map((level) => (
          <div
            key={level.id}
            className="relative flex h-8 min-w-8 border border-disabled-light border-dashed dark:border-disabled-dark"
            style={{ flexGrow: level.lessons.length, flexBasis: 0 }}
            title={`${level.name}: ${level.lessons.length}`}
          >
            <ul aria-label={level.name} className="m-0 flex w-full list-none p-0">
              {level.lessons.map((lesson) => {
                const stateLabel = lesson.isStarted ? TEXTS.lessonStarted : TEXTS.lessonNotStarted;
                const label = `${level.name}, ${TEXTS.lessonOrder} ${lesson.sort_order}, ${lesson.name}: ${stateLabel}`;
                const fillClass = lesson.isStarted
                  ? 'bg-old-progress-light dark:bg-old-progress-dark'
                  : 'bg-transparent';
                return (
                  <li
                    key={lesson.id}
                    title={label}
                    className={`mb-0 h-full min-w-0 flex-1 ${fillClass}`}
                  >
                    <span className="sr-only">{label}</span>
                  </li>
                );
              })}
            </ul>
            <span className="absolute inset-0 flex items-center justify-center font-bold">
              {level.name}
            </span>
          </div>
        ))}
    </section>
  );
}
