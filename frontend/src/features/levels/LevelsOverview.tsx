import { TEXTS } from '@/locales/cs';
import { ListButton } from '@/components/UI/buttons/ListButton';
import GoalMetView from '@/components/UI/GoalMetView';
import HelpButton from '@/features/help/HelpButton';
import HelpText from '@/features/help/HelpText';
import { useUserStore } from '../user-stats/use-user-store';
import { useLevelsStore } from './use-levels-store';
import BlockBar from '@/components/UI/BlockBar';
import { DataState } from '@/components/UI/DataState';
import OverviewCard from '@/components/UI/OverviewCard';
import { useToastStore } from '../toast/use-toast-store';
import { useEffect } from 'react';
import { useAuthStore } from '../auth/use-auth-store';
import { ROUTES } from '@/config/routes.config';
import type { LevelOverviewType } from '@/types/generic.types';
import { useRouteClose } from '@/routing/use-route-close';

/**
 * LevelsOverview component
 *
 * @returns The levels overview UI with list and detail card functionality.
 */
export default function LevelsOverview({
  initialLevels = [],
}: Readonly<{ initialLevels?: LevelOverviewType[] }>) {
  const unpackedLevelId = useLevelsStore((state) => state.unpackedLevelId);
  const hydrateUnpackedLevelId = useLevelsStore((state) => state.hydrateUnpackedLevelId);
  const setUnpackedLevelId = useLevelsStore((state) => state.setUnpackedLevelId);
  const userId = useAuthStore((state) => state.userId);
  const storedLevels = useUserStore((state) => state.levels);
  const levelsLoading = useUserStore((state) => state.levelsLoading);
  const levelsError = useUserStore((state) => state.levelsError);
  const showToast = useToastStore((state) => state.showToast);
  const closeRoute = useRouteClose(ROUTES.home);
  const levels = levelsLoading ? initialLevels : storedLevels;

  useEffect(() => {
    if (!levelsError) return;
    showToast(TEXTS.loadingError, 'error');
  }, [levelsError, showToast]);

  useEffect(() => {
    hydrateUnpackedLevelId(userId);
  }, [hydrateUnpackedLevelId, userId]);

  useEffect(() => {
    if (levelsLoading || unpackedLevelId === null) return;
    if (levels.some((level) => level.id === unpackedLevelId)) return;

    setUnpackedLevelId(userId, null);
  }, [levels, levelsLoading, setUnpackedLevelId, unpackedLevelId, userId]);

  const handleLevelClick = (levelId: number) => {
    setUnpackedLevelId(userId, unpackedLevelId === levelId ? null : levelId);
  };

  return (
    <OverviewCard
      onClose={closeRoute}
      buttonTitle={TEXTS.levelsOverview}
      className={levels.length > 0 ? 'bottom-controls-clearance' : ''}
    >
      <DataState loading={false} hasData={levels.length > 0} noDataMessage={TEXTS.noDashboardData}>
        <div className="pt-1">
          {levels.map((level) => (
            <div key={level.id} className="flex flex-col gap-1">
              <ListButton
                className="flex justify-start p-4 text-left"
                onClick={() => handleLevelClick(level.id)}
                disabled={level.lessons.length === 0}
              >
                <div className="flex w-full items-center justify-between">
                  <p title={`${TEXTS.levelName}`}>{level.name}</p>
                  <GoalMetView
                    current={level.currentProgress ?? 0}
                    goal={level.maximumProgress ?? 0}
                    title={TEXTS.levelsStartedHelp}
                  />
                </div>
              </ListButton>
              {unpackedLevelId === level.id && (
                <div className="flex flex-col gap-1">
                  {level.lessons.map((lesson) => (
                    <BlockBar
                      key={lesson.id}
                      lessonName={lesson.name ?? ''}
                      lessonNumber={lesson.sort_order}
                      currentProgress={lesson.currentProgress ?? 0}
                      dailyProgressChange={lesson.dailyProgressChange ?? 0}
                      maximumProgress={lesson.maximumProgress ?? 1}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <HelpText className="top-20 right-2">{TEXTS.progressTodayHint}</HelpText>
        <div className="pos-bottom-right-control">
          <HelpButton />
        </div>
      </DataState>
    </OverviewCard>
  );
}
