import { DataState } from '@/components/UI/DataState';
import OverviewCard from '@/components/UI/OverviewCard';
import { ListButton } from '@/components/UI/buttons/ListButton';
import { ROUTES } from '@/config/routes.config';
import { useUserStore } from '@/features/user-stats/use-user-store';
import { useRouteClose } from '@/routing/use-route-close';
import { TEXTS } from '@/locales/cs';
import { useState } from 'react';

export default function LessonsOverview() {
  const levels = useUserStore((state) => state.levels);
  const loading = useUserStore((state) => state.levelsLoading);
  const closeRoute = useRouteClose(ROUTES.overviews);
  const [expandedLevelId, setExpandedLevelId] = useState<number | null>(null);
  const levelsWithLessons = levels.filter((level) => level.lessons.length > 0);

  return (
    <OverviewCard
      buttonTitle={TEXTS.lessonsOverview}
      onClose={closeRoute}
      showResetAction={false}
    >
      <DataState
        loading={loading}
        hasData={levelsWithLessons.length > 0}
        noDataMessage={TEXTS.noLessons}
      >
        <div className="flex flex-col gap-1 pt-1 pb-1">
          {levelsWithLessons.map((level) => {
            const isExpanded = expandedLevelId === level.id;
            return (
              <section key={level.id} className="flex flex-col gap-1">
                <ListButton
                  className="justify-start px-4 text-left"
                  aria-expanded={isExpanded}
                  onClick={() => setExpandedLevelId(isExpanded ? null : level.id)}
                >
                  {level.name}
                </ListButton>
                {isExpanded && (
                  <div className="flex flex-col gap-1">
                    {level.lessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className={`flex h-input w-full items-center border border-disabled-light border-dashed px-8 dark:border-disabled-dark ${
                          lesson.isStarted ? '' : 'text-disabled-light dark:text-disabled-dark'
                        }`}
                      >
                        <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                          {lesson.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </DataState>
    </OverviewCard>
  );
}
