import DelayedMessage from '@/components/UI/DelayedMessage';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CloseButton from '@/components/UI/buttons/CloseButton';
import { TEXTS } from '@/locales/cs';
import BaseButton from '@/components/UI/buttons/BaseButton';
import GoalMetView from '@/components/UI/GoalMetView';
import HelpButton from '@/features/help/HelpButton';
import HelpText from '@/features/help/HelpText';
import { useUserStore } from '../dashboard/use-user-store';
import NotificationText from '@/components/UI/NotificationText';
import TextButton from '@/components/UI/buttons/TextButton';

const EMPTY_LEVELS: never[] = [];

/**
 * LevelsOverview component
 *
 * @returns The levels overview UI with list and detail card functionality.
 */
export default function LevelsOverview() {
  const [unpackedIndex, setUnpackedIndex] = useState<number | null>(null);
  const [showMastered, setShowMastered] = useState<boolean>(false);
  const levelsOverview = useUserStore((state) => state.userStats?.levelsOverview);
  const levels = levelsOverview ?? EMPTY_LEVELS;
  const navigate = useNavigate();

  const handleLevelClick = (index: number) => {
    setUnpackedIndex((currentIndex) => (currentIndex === index ? null : index));
  };

  if (levels.length === 0) {
    return (
      <DelayedMessage>
        <NotificationText text={TEXTS.notAvailable} />
      </DelayedMessage>
    );
  }

  const shownLevels = showMastered ? 'masteredCount' : 'startedCount';

  return (
    <div className="card-width relative flex flex-col justify-start">
      <div className="relative flex flex-col gap-1">
        <div className="h-button flex items-center justify-between gap-1">
          <div className="h-button flex grow justify-start p-3">{TEXTS.levelsOverview}</div>
          <CloseButton onClick={() => navigate('/profile')} />
        </div>
        <div className="flex flex-col gap-1 overflow-y-auto">
          {levels.map((level, index) => (
            <div key={level.level_id} className="flex flex-col gap-1">
              <BaseButton
                className="h-input flex grow-0 justify-start p-4 text-left"
                onClick={() => handleLevelClick(index)}
              >
                <div className="flex w-full items-center justify-between">
                  <p>{level.level_name}</p>
                  <GoalMetView current={level[shownLevels]} goal={level.totalCount} />
                </div>
              </BaseButton>
              {unpackedIndex === index && (
                <div className="flex flex-col gap-1 pl-8">
                  {level.lessons.map((lesson) => (
                    <BaseButton
                      key={lesson.lesson_id}
                      className="h-input flex grow-0 justify-start pr-4 text-left"
                      disabled
                    >
                      <div className="flex w-full items-center justify-between">
                        <p>{lesson.lesson_name}</p>
                        <GoalMetView current={lesson[shownLevels]} goal={lesson.totalCount} />
                      </div>
                    </BaseButton>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <HelpText className="right-2 -bottom-4">
          {showMastered ? TEXTS.levelsMasteredHelp : TEXTS.levelsStartedHelp}
        </HelpText>
        <HelpButton className="right-0 -bottom-14" />
        <TextButton onClick={() => setShowMastered((current) => !current)}>
          {showMastered ? TEXTS.masteredCount : TEXTS.startedCount}
        </TextButton>
        <HelpText className="-bottom-15 left-2">{TEXTS.masteredSwitchHelp}</HelpText>
      </div>
    </div>
  );
}
