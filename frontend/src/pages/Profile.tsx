import PropertyView from '@/components/UI/PropertyView';
import DeleteUserButton from '@/features/auth/DeleteUserButton';
import SignoutButton from '@/features/auth/SignoutButton';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { TEXTS } from '@/locales/cs';
import { useEffect, useState, type ChangeEvent, type JSX, type KeyboardEvent } from 'react';
import UserSettings from '@/database/models/user-settings';
import { usePracticeAvailabilityStore } from '@/features/practice/use-practice-availability-store';
import { refreshPracticeAvailability } from '@/features/practice/practice-availability-controller';
import { reportError } from '@/features/logging/monitoring-handler';
import { useToastStore } from '@/features/toast/use-toast-store';

/**
 * Profile page component.
 * @returns The rendered Profile page component.
 */
export default function Profile(): JSX.Element {
  const userEmail = useAuthStore((state) => state.userEmail);
  const userId = useAuthStore((state) => state.userId);
  const [dailyLimit, setDailyLimit] = useState('1');
  const [savedDailyLimit, setSavedDailyLimit] = useState(1);
  const setMaxNewLessonsPerDay = usePracticeAvailabilityStore(
    (state) => state.setMaxNewLessonsPerDay,
  );
  const showToast = useToastStore((state) => state.showToast);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    void UserSettings.syncFromRemote(userId)
      .catch((error: unknown) => reportError('Failed to sync user settings', error))
      .then(() => UserSettings.getOrCreate(userId))
      .then((settings) => {
        if (active) {
          setSavedDailyLimit(settings.max_new_lessons_per_day);
          setDailyLimit(String(settings.max_new_lessons_per_day));
          setMaxNewLessonsPerDay(settings.max_new_lessons_per_day);
        }
      })
      .catch((error: unknown) => reportError('Failed to load user settings', error));
    return () => {
      active = false;
    };
  }, [setMaxNewLessonsPerDay, userId]);

  const handleDailyLimitChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDailyLimit(event.currentTarget.value);
  };

  const saveDailyLimit = () => {
    const limit = Number(dailyLimit);
    if (!userId || !Number.isInteger(limit) || limit < 1) {
      setDailyLimit(String(savedDailyLimit));
      return;
    }
    if (limit === savedDailyLimit) return;

    setSavedDailyLimit(limit);
    setMaxNewLessonsPerDay(limit);
    void UserSettings.updateDailyNewLessonLimit(userId, limit)
      .then(async () => {
        await UserSettings.syncFromRemote(userId);
        await refreshPracticeAvailability(userId);
      })
      .catch((error: unknown) => {
        reportError('Failed to save daily new lesson limit', error);
        showToast(TEXTS.syncErrorToast, 'error');
      });
  };

  const handleDailyLimitBlur = () => {
    saveDailyLimit();
  };

  const handleDailyLimitKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') event.currentTarget.blur();
  };

  return (
    <div className="card-width grow-0 gap-1">
      <div className="mx-auto mt-4 mb-4 w-64 text-left">
        <PropertyView
          label={TEXTS.profileEmailLabel}
          className="justify-start"
          classNameLabel="w-20"
          classNameValue="wrap-break-word"
        >
          {userEmail || TEXTS.notAvailable}
        </PropertyView>
      </div>
      <div className="mx-auto mb-4 w-64 text-left">
        <div className="flex items-center gap-1">
          <label htmlFor="daily-new-lesson-limit" className="w-40 shrink-0 font-bold">
            {TEXTS.profileDailyNewLessonLimit}
          </label>
          <input
            id="daily-new-lesson-limit"
            type="number"
            min={1}
            step={1}
            value={dailyLimit}
            onChange={handleDailyLimitChange}
            onBlur={handleDailyLimitBlur}
            onKeyDown={handleDailyLimitKeyDown}
            title={TEXTS.profileDailyNewLessonLimitHint}
            className="h-input color-base min-w-0 grow border border-dashed px-4 text-right focus:outline-none"
          />
        </div>
      </div>
      <SignoutButton />
      <DeleteUserButton />
    </div>
  );
}
