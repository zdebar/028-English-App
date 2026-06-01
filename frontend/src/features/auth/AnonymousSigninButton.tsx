import { useCallback, useState, type JSX } from 'react';
import SigninButton from '@/features/auth/SigninButton';
import { loginAnonymous } from '@/features/auth/anonymous-auth-service';
import { useToastStore } from '@/features/toast/use-toast-store';
import { reportError } from '@/features/logging/monitoring-handler';
import { TEXTS } from '@/locales/cs';

export default function AnonymousSigninButton(): JSX.Element {
  const showToast = useToastStore((s) => s.showToast);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startAnonymous = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await loginAnonymous();
    } catch (err) {
      reportError('Anonymous sign-in failed', err);
      showToast(TEXTS.authInitErrorToast, 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, showToast]);

  return (
    <SigninButton
      isSubmitting={isSubmitting}
      onClick={startAnonymous}
      title={TEXTS.anonymousSigninTooltip}
      label={TEXTS.anonymousSigninButton}
      loadingLabel={TEXTS.anonymousSigninLoading}
    />
  );
}
