import { useCallback, useState, type JSX } from 'react';
import { supabaseInstance } from '@/config/supabase.config';
import SigninButton from '@/features/auth/SigninButton';
import { useToastStore } from '@/features/toast/use-toast-store';
import { reportError } from '@/features/logging/monitoring-handler';
import { TEXTS } from '@/locales/cs';

type ConvertButtonProps = Readonly<{
  className?: string;
}>;

export default function ConvertAnonymousUserButton({ className }: ConvertButtonProps): JSX.Element {
  const showToast = useToastStore((state) => state.showToast);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const convertAnonymousUser = useCallback(async () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabaseInstance.auth.linkIdentity({ provider: 'google' });
      if (error) {
        throw new Error(error.message);
      }

      const redirectUrl = data?.url;
      if (redirectUrl) {
        globalThis.location.assign(redirectUrl);
        return;
      }

      showToast(TEXTS.convertAnonymousSuccessToast, 'success');
    } catch (error) {
      reportError('Anonymous conversion failed', error);
      showToast(TEXTS.convertAnonymousErrorToast, 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, showToast]);

  return (
    <SigninButton
      className={className}
      isSubmitting={isSubmitting}
      onClick={convertAnonymousUser}
      title={TEXTS.convertAnonymousButtonTooltip}
      label={TEXTS.convertAnonymousButton}
      loadingLabel={TEXTS.convertAnonymousLoading}
    />
  );
}
