import PropertyView from '@/components/UI/PropertyView';
import DeleteUserButton from '@/features/auth/DeleteUserButton';
import SignoutButton from '@/features/auth/SignoutButton';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { TEXTS } from '@/locales/cs';
import { type JSX } from 'react';
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
