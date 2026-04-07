import DelayedMessage from '@/components/UI/DelayedMessage';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CloseButton from '@/components/UI/buttons/CloseButton';
import { TEXTS } from '@/locales/cs';
import BaseButton from '@/components/UI/buttons/BaseButton';
import GoalMetView from '@/components/UI/GoalMetView';
import HelpButton from '@/features/help/HelpButton';
import HelpText from '@/features/help/HelpText';
import { useUserStore } from '../user-stats/use-user-store';
import NotificationText from '@/components/UI/NotificationText';
import TextButton from '@/components/UI/buttons/TextButton';
import BlockBar from '@/features/user-stats/BlockBar';

/**
 * LevelsOverview component
 *
 * @returns The levels overview UI with list and detail card functionality.
 */
export default function LevelsOverview() {
  const [unpackedIndex, setUnpackedIndex] = useState<number | null>(null);
  const [showMastered, setShowMastered] = useState<boolean>(false);
  const levels = useUserStore((state) => state.levels);
  const navigate = useNavigate();

  const handleLevelClick = (index: number) => {
    setUnpackedIndex((currentIndex) => (currentIndex === index ? null : index));
  };

  const shownLevels = showMastered ? 'masteredCount' : 'startedCount';

  return (
    <div className="card-width relative flex flex-col justify-start">
      <div className="relative flex flex-col gap-1">
        <div className="h-button flex items-center justify-between gap-1">
          <div className="h-button flex grow justify-start p-3">{TEXTS.levelsOverview}</div>
          <CloseButton onClick={() => navigate('/profile')} />
        </div>
        {levels.length === 0 ? (
          <DelayedMessage>
            <NotificationText text={TEXTS.notAvailable} className="color-info pt-4" />
          </DelayedMessage>
        ) : (
          <div>
            <div className="flex flex-col gap-1 overflow-y-auto">
              {levels.map((level, index) => (
                <div key={level.id} className="flex flex-col gap-1">
                  <BaseButton
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
                  </BaseButton>
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
                            showMastered ? (lesson.masteredTodayCount ?? 0) : (lesson.startedTodayCount ?? 0)
                          }
                          lessonCount={lesson.totalCount ?? 1}
                        />                          
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <HelpText className="right-2 top-10">
              {showMastered ? TEXTS.levelsMasteredHelp : TEXTS.levelsStartedHelp}
            </HelpText>
            <HelpButton className="right-0 -bottom-14" />
            <TextButton
              onClick={() => setShowMastered((current) => !current)}
              title={TEXTS.masteredSwitchHelp}
            >
              {showMastered ? TEXTS.masteredCount : TEXTS.startedCount}
            </TextButton>
            <HelpText className="-bottom-15 left-2">{TEXTS.masteredSwitchHelp} </HelpText>
          </div>
        )}
      </div>
    </div>
  );
}
