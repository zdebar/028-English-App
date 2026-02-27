import DelayedMessage from '@/components/UI/DelayedMessage';
import type { LevelsOverview } from '@/types/local.types';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CloseButton from '@/components/UI/buttons/CloseButton';
import { TEXTS } from '@/locales/cs';
import ButtonRectangular from '@/components/UI/buttons/ButtonRectangular';
import GoalMetView from '@/components/UI/GoalMetView';
import HelpButton from '@/features/help/HelpButton';
import HelpText from '@/features/help/HelpText';
import { useUserStore } from '../dashboard/use-user-store';

/**
 * LevelsOverview component
 *
 * @returns The levels overview UI with list and detail card functionality.
 */
export default function LevelsOverview() {
  const [unpackedIndex, setUnpackedIndex] = useState<number | null>(null);
  const [mastered, setMastered] = useState<boolean>(false);
  const levels = useUserStore((state) => state.userStats?.levelsOverview);
  const navigate = useNavigate();

  const handleLevelClick = (index: number) => {
    if (unpackedIndex === index) {
      setUnpackedIndex(null);
    } else {
      setUnpackedIndex(index);
    }
  };

  if (!levels || levels.length === 0) {
    return <DelayedMessage text={TEXTS.notAvailable} />;
  }

  const shownLevels = mastered ? 'masteredCount' : 'startedCount';

  return (
    <div className="card-width relative flex flex-col justify-start">
      <div className="relative flex flex-col gap-1">
        <div className="h-button flex items-center justify-between gap-1">
          <div className="h-button flex grow justify-start p-4">{TEXTS.levelsOverview}</div>
          <CloseButton onClick={() => navigate('/profile')} />
        </div>
        <div className="flex flex-col gap-1 overflow-y-auto">
          {levels && levels.length > 0 ? (
            levels.map((level, index) => (
              <div key={level.level_id} className="flex flex-col gap-1">
                <ButtonRectangular
                  key={level.level_id}
                  className="h-input flex grow-0 justify-start p-4 text-left"
                  onClick={() => handleLevelClick(index)}
                >
                  <div className="flex w-full items-center justify-between">
                    <p>{level.level_name}</p>
                    <GoalMetView current={level[shownLevels]} goal={level.totalCount} />
                  </div>
                </ButtonRectangular>
                {unpackedIndex === index && (
                  <div className="flex flex-col gap-1 pl-8">
                    {level.lessons.map((lesson) => (
                      <ButtonRectangular
                        key={lesson.lesson_id}
                        className="h-input flex grow-0 justify-start pr-4 text-left"
                        disabled={true}
                      >
                        <div className="flex w-full items-center justify-between">
                          <p>{lesson.lesson_name}</p>
                          <GoalMetView current={lesson[shownLevels]} goal={lesson.totalCount} />
                        </div>
                      </ButtonRectangular>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="p-4">{TEXTS.notAvailable}</p>
          )}
        </div>
        <HelpText className="right-2 -bottom-4">
          {mastered ? TEXTS.levelsMasteredHelp : TEXTS.levelsStartedHelp}
        </HelpText>
        <HelpButton className="right-0 -bottom-14" />
        <button
          className="notification absolute -bottom-9 left-4"
          onClick={() => setMastered(!mastered)}
        >
          {mastered ? TEXTS.masteredCount : TEXTS.startedCount}
        </button>
        <HelpText className="-bottom-15 left-2">{TEXTS.masteredSwitchHelp}</HelpText>
      </div>
    </div>
  );
}
