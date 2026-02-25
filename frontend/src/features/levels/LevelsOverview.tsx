import LoadingMessage from '@/components/UI/LoadingMessage';
import UserItem from '@/database/models/user-items';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { useFetch } from '@/hooks/use-fetch';
import type { LevelsOverview } from '@/types/local.types';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CloseButton from '@/components/UI/buttons/CloseButton';
import { TEXTS } from '@/locales/cs';
import ButtonRectangular from '@/components/UI/buttons/ButtonRectangular';
import GoalMetView from '@/components/UI/GoalMetView';
import HelpButton from '@/features/help/HelpButton';
import HelpText from '@/features/help/HelpText';

/**
 * LevelsOverview component
 *
 * @returns The levels overview UI with list and detail card functionality.
 */
export default function LevelsOverview() {
  const [unpackedIndex, setUnpackedIndex] = useState<number | null>(null);
  const { userId } = useAuthStore();
  const navigate = useNavigate();

  const fetchLevels = useCallback(async () => {
    if (!userId) return [];
    return UserItem.getLevelsOverview(userId);
  }, [userId]);

  const { data: levels, loading } = useFetch<LevelsOverview[]>(fetchLevels);

  const handleLevelClick = (index: number) => {
    if (unpackedIndex === index) {
      setUnpackedIndex(null);
    } else {
      setUnpackedIndex(index);
    }
  };

  if (loading) {
    return <LoadingMessage />;
  }

  return (
    <div className="card-width relative flex h-full flex-col justify-start gap-1">
      <div className="relative flex flex-col gap-1">
        <div className="h-button flex items-center justify-between gap-1">
          <div className="h-button flex grow justify-start p-4">{TEXTS.levelsOverview}</div>
          <CloseButton onClick={() => navigate('/profile')} />
        </div>
        <div className="flex items-center justify-between gap-1"></div>
        <div className="flex flex-col gap-1 overflow-y-auto">
          {levels && levels.length > 0 ? (
            levels.map((level, index) => (
              <>
                <ButtonRectangular
                  key={level.level_id ?? 0}
                  className="h-input flex grow-0 justify-start p-4 text-left"
                  onClick={() => handleLevelClick(index)}
                >
                  <div className="flex w-full items-center justify-between">
                    <p>{level.level_name}</p>
                    <GoalMetView count={level.startedCount} goal={level.totalCount} />
                  </div>
                </ButtonRectangular>
                {unpackedIndex === index && (
                  <div className="flex flex-col gap-1 pl-8">
                    {level.lessons.map((lesson) => (
                      <ButtonRectangular
                        key={lesson.lesson_id ?? 0}
                        className="h-input flex grow-0 justify-start pr-4 text-left"
                        disabled={true}
                      >
                        <div className="flex w-full items-center justify-between">
                          <p>
                            {lesson.lesson_id}{' '}
                            {lesson.lesson_name ?? `${TEXTS.lessons} ${lesson.lesson_id}`}
                          </p>
                          <GoalMetView count={lesson.startedCount} goal={lesson.totalCount} />
                        </div>
                      </ButtonRectangular>
                    ))}
                  </div>
                )}
              </>
            ))
          ) : (
            <p className="p-4">{TEXTS.notAvailable}</p>
          )}
        </div>
        <HelpText className="right-2 -bottom-5">{TEXTS.levelsOverviewHelp}</HelpText>
        <HelpButton className="right-2 -bottom-13" />
      </div>
    </div>
  );
}
