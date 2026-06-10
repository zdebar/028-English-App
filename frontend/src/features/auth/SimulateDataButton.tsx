import { useCallback, useState, type JSX } from 'react';
import SigninButton from '@/features/auth/SigninButton';
import { loginAnonymous } from '@/features/auth/anonymous-auth-service';
import { useToastStore } from '@/features/toast/use-toast-store';
import { reportError } from '@/features/logging/monitoring-handler';
import { TEXTS } from '@/locales/cs';

export default function SimulateDataButton(): JSX.Element {
  const showToast = useToastStore((s) => s.showToast);
  const [isLoading, setIsLoading] = useState(false);

  const simulateData = useCallback(
    async (token?: string) => {
      if (!token) return;

      if (isLoading) return;
      setIsLoading(true);

      try {
        await loginAnonymous({ captchaToken: token });
        showToast(TEXTS.simulateDataSuccessToast, 'success');
      } catch (err) {
        reportError('Simulate data failed', err);
        showToast(TEXTS.simulateDataErrorToast, 'error');
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, showToast],
  );

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
