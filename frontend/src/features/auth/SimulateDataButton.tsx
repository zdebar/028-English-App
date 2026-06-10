import { useCallback, useState, type JSX } from 'react';
import SigninButton from '@/features/auth/SigninButton';
import UserItems from '@/database/models/user-items';
import { useToastStore } from '@/features/toast/use-toast-store';
import { reportError } from '@/features/logging/monitoring-handler';
import { TEXTS } from '@/locales/cs';
import { useAuthStore } from './use-auth-store';

export default function SimulateDataButton(): JSX.Element {
  const showToast = useToastStore((s) => s.showToast);
  const [isLoading, setIsLoading] = useState(false);
  const userId = useAuthStore((state) => state.userId);

  const simulateData = useCallback(async () => {
    if (isLoading || !userId) return;
    setIsLoading(true);

    try {
      await UserItems.simulateData(userId);
      showToast(TEXTS.simulateDataSuccessToast, 'success');
    } catch (err) {
      reportError('Simulate data failed', err);
      showToast(TEXTS.simulateDataErrorToast, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, showToast, userId]);

  return (
    <SigninButton
      isSubmitting={isLoading}
      onClick={simulateData}
      title={TEXTS.simulateDataTooltip}
      label={TEXTS.simulateDataButton}
      loadingLabel={TEXTS.simulateDataLoading}
    />
  );
}
