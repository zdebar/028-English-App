import Notification from '@/components/UI/Notification';
import HelpText from '@/features/help/HelpText';
import { useUserStore } from '@/features/user-stats/use-user-store';
import { ARIA_TEXTS, TEXTS } from '@/locales/cs';

type DashboardProps = Readonly<{
  className?: string;
}>;

export default function Dashboard({ className = '' }: DashboardProps) {
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
      className={`min-w-card relative mx-auto flex w-full flex-col gap-0.5 ${className}`}
      aria-label={TEXTS.lessonOverview}
    >
      <HelpText className="-top-7 right-0">{TEXTS.lessonOverview}</HelpText>
      {levels
        .filter((level) => level.lessons.length > 0)
        .map((level) => (
          <div key={level.id} className="grid grid-cols-[3rem_minmax(0,1fr)] items-start gap-0.5">
            <div className="flex h-7 items-center justify-center border border-dashed border-disabled-light px-1 font-bold text-disabled-light dark:border-disabled-dark dark:text-disabled-dark">
              {level.name}
            </div>
            <ul
              aria-label={level.name}
              className="m-0 grid w-full list-none grid-cols-[repeat(auto-fill,minmax(0.8rem,1fr))] items-start gap-0.5 p-0"
            >
              {level.lessons.map((lesson) => {
                const stateLabel = lesson.isStarted ? TEXTS.lessonStarted : TEXTS.lessonNotStarted;
                const label = `${level.name}, ${TEXTS.lessonOrder} ${lesson.sort_order}, ${lesson.name}: ${stateLabel}`;
                const stateClass = lesson.isStarted
                  ? 'border-light dark:border-dark border-solid'
                  : 'border-disabled-light dark:border-disabled-dark border-dashed';
                return (
                  <li
                    key={lesson.id}
                    title={label}
                    className={`mb-0 h-7 w-full border bg-inherit ${stateClass}`}
                  >
                    <span className="sr-only">{label}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
    </section>
  );
}
