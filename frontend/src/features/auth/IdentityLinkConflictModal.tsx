import { supabaseInstance } from '@/config/supabase.config';
import {
  clearAnonymousSessionFallback,
  saveAnonymousSessionFallback,
} from '@/features/auth/anonymous-session-fallback';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { reportError } from '@/features/logging/monitoring-handler';
import { Modal } from '@/features/modal/Modal';
import { useToastStore } from '@/features/toast/use-toast-store';
import { TEXTS } from '@/locales/cs';
import { useCallback, type JSX } from 'react';

const AUTH_REDIRECT_TO = new URL(import.meta.env.BASE_URL, globalThis.location.origin).toString();

export default function IdentityLinkConflictModal(): JSX.Element | null {
  const isOpen = useAuthStore((state) => state.hasIdentityLinkConflict);
  const dismiss = useAuthStore((state) => state.dismissIdentityLinkConflict);
  const showToast = useToastStore((state) => state.showToast);

  const signInToExistingAccount = useCallback(async () => {
    let fallbackSaved = false;

    try {
      const { data: sessionData, error: sessionError } = await supabaseInstance.auth.getSession();
      if (sessionError) {
        throw sessionError;
      }
      if (!sessionData.session?.user.is_anonymous) {
        throw new Error('Anonymous session is missing before existing-account sign-in.');
      }

      saveAnonymousSessionFallback(sessionData.session);
      fallbackSaved = true;

      const { data, error } = await supabaseInstance.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: AUTH_REDIRECT_TO,
          queryParams: { prompt: 'select_account' },
          skipBrowserRedirect: true,
        },
      });
      if (error) {
        throw error;
      }
      if (!data.url) {
        throw new Error('Google sign-in did not return a redirect URL.');
      }

      globalThis.location.assign(data.url);
    } catch (error) {
      clearAnonymousSessionFallback();
      reportError('Existing Google account sign-in failed', error);
      showToast(
        fallbackSaved ? TEXTS.existingAccountSigninErrorToast : TEXTS.authInitErrorToast,
        'error',
      );
    }
  }, [showToast]);

  if (!isOpen) {
    return null;
  }

  return (
    <Modal
      onConfirm={signInToExistingAccount}
      onClose={dismiss}
      cancelLabel={TEXTS.continueAsGuest}
      confirmLabel={TEXTS.signInExistingAccount}
      actionsLayout="vertical"
    >
      <p className="font-bold">{TEXTS.identityLinkConflictTitle}</p>
      <p>{TEXTS.identityLinkConflictText}</p>
    </Modal>
  );
}
