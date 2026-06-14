import { useCallback, useState, type JSX } from 'react';
import SigninButton from '@/features/auth/SigninButton';
import UserItems from '@/database/models/user-items';
import { useToastStore } from '@/features/toast/use-toast-store';
import { reportError } from '@/features/logging/monitoring-handler';
import { TEXTS } from '@/locales/cs';
import { useAuthStore } from '../auth/use-auth-store';
import { useLocalStorageSync } from '@/hooks/use-local-storage-sync';
import { useSyncStore } from '@/features/synchronization/use-sync-store';

export default function SimulateDataButton(): JSX.Element | null {
  const showToast = useToastStore((s) => s.showToast);
  const [isLoading, setIsLoading] = useState(false);
  const userId = useAuthStore((state) => state.userId);
  const authLoading = useAuthStore((state) => state.loading);
  const isSynchronizing = useSyncStore((state) => state.isSynchronizing);
  const isSynchronized = useSyncStore((state) => state.isSynchronized);
  const storageKey = userId ? `simulate-data-${userId}` : 'simulate-data-guest';
  const [hasSimulatedData, setHasSimulatedData] = useLocalStorageSync<boolean>(storageKey, false);
  const isDisabled = authLoading || isSynchronizing || !isSynchronized || hasSimulatedData;

  const simulateData = useCallback(async () => {
    if (isLoading || isDisabled || !userId) return;
    setIsLoading(true);

    try {
      await UserItems.simulateData(userId);
      setHasSimulatedData(true);
      showToast(TEXTS.simulateDataSuccessToast, 'success');
    } catch (err) {
      reportError('Simulate data failed', err);
      showToast(TEXTS.simulateDataErrorToast, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [isDisabled, isLoading, setHasSimulatedData, showToast, userId]);

  if (isDisabled || !userId) return null;

  return (
    <>
      <SigninButton
        disabled={isDisabled}
        isSignin={isLoading}
        onClick={simulateData}
        title={TEXTS.simulateDataTooltip}
        label={TEXTS.simulateDataButton}
        signinLabel={TEXTS.simulateDataLoading}
      />
      <p className="p-2 text-sm">{TEXTS.simulateDataExplanation}</p>
    </>
  );
}
