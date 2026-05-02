import { useNavigate } from 'react-router-dom';
import { TEXTS } from '@/locales/cs';
import StyledButton from '@/components/UI/buttons/StyledButton';
import GoalMetView from '@/components/UI/GoalMetView';
import HelpButton from '@/features/help/HelpButton';
import HelpText from '@/features/help/HelpText';
import { useUserStore } from '../user-stats/use-user-store';
import { useLevelsStore } from './use-levels-store';
import MasteredToggleButton from '@/components/UI/buttons/MasteredToggleButton';
import BlockBar from '@/components/UI/BlockBar';
import { DataState } from '@/components/UI/DataState';
import OverviewCard from '@/components/UI/OverviewCard';

/**
 * LevelsOverview component
 *
 * @returns The levels overview UI with list and detail card functionality.
 */
export default function LevelsOverview() {
  const unpackedIndex = useLevelsStore((state) => state.unpackedIndex);
  const setUnpackedIndex = useLevelsStore((state) => state.setUnpackedIndex);
  const showMastered = useLevelsStore((state) => state.showMastered);
  const setShowMastered = useLevelsStore((state) => state.setShowMastered);
  const levels = useUserStore((state) => state.levels);
  const navigate = useNavigate();

  const handleLevelClick = (index: number) => {
    setUnpackedIndex(unpackedIndex === index ? null : index);
  };

  const shownLevels = showMastered ? 'masteredCount' : 'startedCount';

  return (
    <OverviewCard onClose={() => navigate('/profile')} buttonTitle={TEXTS.levelsOverview}>
      <DataState loading={false} hasData={levels.length > 0} noDataMessage={TEXTS.notAvailable}>
        {levels.map((level, index) => (
          <div key={level.id} className="flex flex-col gap-1">
            <StyledButton
              className="h-input flex grow-0 justify-start p-4 text-left"
              onClick={() => handleLevelClick(index)}
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
            </StyledButton>
            {unpackedIndex === index && (
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

        <HelpText className="top-10 right-2">
          {showMastered ? TEXTS.levelsMasteredHelp : TEXTS.levelsStartedHelp}
        </HelpText>
        <HelpButton className="right-0 -bottom-14" />
        <MasteredToggleButton showMastered={showMastered} setShowMastered={setShowMastered} />
      </DataState>
    </OverviewCard>
  );
}
