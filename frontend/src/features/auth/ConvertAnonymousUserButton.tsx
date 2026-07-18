import { useCallback, useState, type JSX } from 'react';
import { supabaseInstance } from '@/config/supabase.config';
import SigninButton from '@/features/auth/SigninButton';
import { useToastStore } from '@/features/toast/use-toast-store';
import { reportError } from '@/features/logging/monitoring-handler';
import {
  clearAnonymousSessionFallback,
  saveAnonymousSessionFallback,
} from '@/features/auth/anonymous-session-fallback';
import { TEXTS } from '@/locales/cs';

type ConvertButtonProps = Readonly<{
  className?: string;
}>;

const AUTH_REDIRECT_TO = new URL(import.meta.env.BASE_URL, globalThis.location.origin).toString();

export default function ConvertAnonymousUserButton({ className }: ConvertButtonProps): JSX.Element {
  const showToast = useToastStore((state) => state.showToast);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const convertAnonymousUser = useCallback(async () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: sessionData, error: sessionError } = await supabaseInstance.auth.getSession();
      if (sessionError) {
        throw sessionError;
      }
      if (!sessionData.session?.user.is_anonymous) {
        throw new Error('Anonymous session is missing before Google identity linking.');
      }

      saveAnonymousSessionFallback(sessionData.session, 'link-google-identity');

      const { data, error } = await supabaseInstance.auth.linkIdentity({
        provider: 'google',
        options: { redirectTo: AUTH_REDIRECT_TO, skipBrowserRedirect: true },
      });
      if (error) {
        throw error;
      }

      if (!data.url) {
        throw new Error('Google identity linking did not return a redirect URL.');
      }

      globalThis.location.assign(data.url);
    } catch (error) {
      clearAnonymousSessionFallback();
      reportError('Anonymous conversion failed', error);
      showToast(TEXTS.convertAnonymousErrorToast, 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, showToast]);

  return (
    <SigninButton
      className={className}
      disabled={isSubmitting}
      onClick={convertAnonymousUser}
      title={TEXTS.convertAnonymousButtonTooltip}
      label={TEXTS.convertAnonymousButton}
      signinLabel={TEXTS.convertAnonymousLoading}
      isSignin={isSubmitting}
    />
  );
}
