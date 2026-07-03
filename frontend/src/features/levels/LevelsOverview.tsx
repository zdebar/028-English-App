import { useNavigate } from 'react-router-dom';
import { TEXTS } from '@/locales/cs';
import { ListButton } from '@/components/UI/buttons/ListButton';
import GoalMetView from '@/components/UI/GoalMetView';
import HelpButton from '@/features/help/HelpButton';
import HelpText from '@/features/help/HelpText';
import { useUserStore } from '../user-stats/use-user-store';
import { useLevelsStore } from './use-levels-store';
import MasteredToggleButton from '@/features/progress/MasteredToggleButton';
import BlockBar from '@/components/UI/BlockBar';
import { DataState } from '@/components/UI/DataState';
import OverviewCard from '@/components/UI/OverviewCard';
import { useToastStore } from '../toast/use-toast-store';
import { useEffect } from 'react';
import { useAuthStore } from '../auth/use-auth-store';

/**
 * LevelsOverview component
 *
 * @returns The levels overview UI with list and detail card functionality.
 */
export default function LevelsOverview() {
  const unpackedLevelId = useLevelsStore((state) => state.unpackedLevelId);
  const hydrateUnpackedLevelId = useLevelsStore((state) => state.hydrateUnpackedLevelId);
  const setUnpackedLevelId = useLevelsStore((state) => state.setUnpackedLevelId);
  const showMastered = useLevelsStore((state) => state.showMastered);
  const setShowMastered = useLevelsStore((state) => state.setShowMastered);
  const userId = useAuthStore((state) => state.userId);
  const levels = useUserStore((state) => state.levels);
  const levelsLoading = useUserStore((state) => state.levelsLoading);
  const levelsError = useUserStore((state) => state.levelsError);
  const showToast = useToastStore((state) => state.showToast);
  const navigate = useNavigate();

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

  const shownLevels = showMastered ? 'masteredCount' : 'startedCount';

  return (
    <OverviewCard onClose={() => navigate('/profile')} buttonTitle={TEXTS.levelsOverview}>
      <DataState
        loading={levelsLoading}
        hasData={levels.length > 0}
        noDataMessage={TEXTS.notAvailable}
      >
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
                  current={level[shownLevels]}
                  goal={level['totalCount']}
                  title={showMastered ? TEXTS.levelsMasteredHelp : TEXTS.levelsStartedHelp}
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
                    isMastered={showMastered}
                    previousCount={
                      showMastered
                        ? (lesson.masteredCount ?? 0) - (lesson.masteredTodayCount ?? 0)
                        : (lesson.startedCount ?? 0) - (lesson.startedTodayCount ?? 0)
                    }
                    todayCount={
                      showMastered
                        ? (lesson.masteredTodayCount ?? 0)
                        : (lesson.startedTodayCount ?? 0)
                    }
                    lessonCount={lesson.totalCount ?? 1}
                  />
                ))}
              </div>
            )}
          </div>
        ))}

        <HelpText className="top-20 right-2">
          {showMastered ? TEXTS.levelsMasteredHelp : TEXTS.levelsStartedHelp}
        </HelpText>
        <div className="pos-bottom-right-control">
          <HelpButton />
        </div>
        <MasteredToggleButton
          showMastered={showMastered}
          setShowMastered={setShowMastered}
          className="pos-mastered-toggle"
        />
      </DataState>
    </OverviewCard>
  );
}
