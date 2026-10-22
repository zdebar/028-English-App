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
import { dataSync } from '@/database/utils/data-sync.utils';
import AudioRecord from '@/database/models/audio-records';
import { useSyncStore } from '@/features/synchronization/use-sync-store';
import StyledButton from '@/components/UI/buttons/StyledButton';
import { MenuButtonText } from '@/components/UI/MenuButtonText';
import {
  invalidatePracticeCache,
  warmPracticeCache,
} from '@/features/practice/practice-prefetch';

/**
 * Profile page component.
 * @returns The rendered Profile page component.
 */
export default function Profile(): JSX.Element {
  const userEmail = useAuthStore((state) => state.userEmail);
  const userFullName = useAuthStore((state) => state.userFullName);
  const userId = useAuthStore((state) => state.userId);
  const maxNewLessonsPerDay = usePracticeAvailabilityStore(
    (state) => state.maxNewLessonsPerDay,
  );
  const [dailyLimit, setDailyLimit] = useState(String(maxNewLessonsPerDay));
  const setMaxNewLessonsPerDay = usePracticeAvailabilityStore(
    (state) => state.setMaxNewLessonsPerDay,
  );
  const showToast = useToastStore((state) => state.showToast);
  const isSynchronizing = useSyncStore((state) => state.isSynchronizing);
  const setManualSyncing = useSyncStore((state) => state.setManualSyncing);
  const setSynchronizing = useSyncStore((state) => state.setSynchronizing);
  const setSynchronized = useSyncStore((state) => state.setSynchronized);
  const setSyncError = useSyncStore((state) => state.setSyncError);

  const handleFullSync = async () => {
    if (!userId || useSyncStore.getState().isSynchronizing) return;
    setManualSyncing(true);
    setSynchronizing(true);
    try {
      await dataSync(userId, true);
      const audioSummary = await AudioRecord.syncFromRemote();
      if (audioSummary.failed > 0) {
        reportError('Audio archive sync errors', audioSummary.sampleErrors);
      }
      const orphanedSummary = await AudioRecord.removeOrphaned();
      if (orphanedSummary.failed > 0) {
        reportError('Audio archive sync errors', orphanedSummary.sampleErrors);
      }

      setSynchronized(true);
      setSyncError(false);
      showToast(TEXTS.syncSuccessToast, 'success');
    } catch (error) {
      setSynchronized(false);
      setSyncError(true);
      reportError('Manual full synchronization failed', error);
      showToast(TEXTS.syncErrorToast, 'error');
    } finally {
      invalidatePracticeCache(userId);
      void warmPracticeCache(userId).catch((error: unknown) =>
        reportError('Failed to prefetch practice cache after full sync', error),
      );
      try {
        await refreshPracticeAvailability(userId);
      } finally {
        setManualSyncing(false);
        setSynchronizing(false);
      }
    }
  };

  useEffect(() => {
    setDailyLimit(String(maxNewLessonsPerDay));
  }, [maxNewLessonsPerDay]);

  const handleDailyLimitChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDailyLimit(event.currentTarget.value);
  };

  const saveDailyLimit = () => {
    const limit = Number(dailyLimit);
    if (!userId || !Number.isInteger(limit) || limit < 1) {
      setDailyLimit(String(maxNewLessonsPerDay));
      return;
    }
    if (limit === maxNewLessonsPerDay) return;

    setMaxNewLessonsPerDay(limit);
    void UserSettings.updateDailyNewLessonLimit(userId, limit)
      .then(() => refreshPracticeAvailability(userId))
      .catch((error: unknown) => {
        setMaxNewLessonsPerDay(maxNewLessonsPerDay);
        setDailyLimit(String(maxNewLessonsPerDay));
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
          label={TEXTS.profileNameLabel}
          className="justify-start"
          classNameLabel="w-20"
          classNameValue="wrap-break-word"
        >
          {userFullName ?? TEXTS.notAvailable}
        </PropertyView>
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
      <StyledButton
        className="card-width h-button px-4"
        disabled={!userId || isSynchronizing}
        onClick={handleFullSync}
        title={TEXTS.profileFullSyncHint}
      >
        <MenuButtonText>
          {isSynchronizing ? TEXTS.profileFullSyncInProgress : TEXTS.profileFullSyncButton}
        </MenuButtonText>
      </StyledButton>
      <SignoutButton />
      <DeleteUserButton />
    </div>
  );
}
