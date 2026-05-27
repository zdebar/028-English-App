import { useCallback, useEffect, useMemo, useState, type JSX } from 'react';
import { useAuthStore } from '@/features/auth/use-auth-store';
import DemoCaptcha from '@/features/auth/DemoCaptcha';
import { TEXTS } from '@/locales/cs';
import { useToastStore } from '@/features/toast/use-toast-store';
import { reportError } from '@/features/logging/monitoring-handler';

function getErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  if (raw.startsWith('DEMO_AUTH_FAILED:')) {
    const detail = raw.slice('DEMO_AUTH_FAILED:'.length).trim();
    if (import.meta.env.DEV && detail) {
      return `${TEXTS.demoSigninError} (${detail})`;
    }
    return TEXTS.demoSigninError;
  }
  if (raw === 'DEMO_INVALID_CREDENTIALS') {
    return TEXTS.demoSigninInvalidCredentialsError;
  }
  if (raw === 'DEMO_EMAIL_PROVIDER_DISABLED') {
    return TEXTS.demoSigninEmailProviderDisabledError;
  }
  if (raw === 'DEMO_AUTH_FAILED') {
    return TEXTS.demoSigninError;
  }
  if (raw === 'RATE_LIMIT') {
    return TEXTS.demoSigninRateLimitError;
  }
  if (raw === 'CAPTCHA_FAILED') {
    return TEXTS.demoSigninCaptchaError;
  }
  const normalized = raw.toLowerCase();

  if (normalized.includes('429')) {
    return TEXTS.demoSigninRateLimitError;
  }
  if (normalized.includes('captcha')) {
    return TEXTS.demoSigninCaptchaError;
  }
  return TEXTS.demoSigninError;
}

export default function DemoSessionPanel(): JSX.Element {
  const loginDemoWithCaptcha = useAuthStore((state) => state.loginDemoWithCaptcha);
  const showToast = useToastStore((state) => state.showToast);

  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim() ?? '';
  const captchaSize = useMemo(
    () =>
      import.meta.env.VITE_TURNSTILE_SIZE === 'compact'
        ? 'compact'
        : import.meta.env.VITE_TURNSTILE_SIZE === 'normal'
          ? 'normal'
          : 'flexible',
    [],
  );

  const startDemoFlow = useCallback(() => {
    if (!turnstileSiteKey) {
      showToast(TEXTS.demoSigninMissingCaptchaKey, 'error');
      return;
    }
    setCaptchaToken(null);
    setShowCaptcha(true);
  }, [showToast, turnstileSiteKey]);

  useEffect(() => {
    const submitDemoLogin = async () => {
      if (!captchaToken || isSubmitting) {
        return;
      }

      setIsSubmitting(true);
      try {
        await loginDemoWithCaptcha(captchaToken);
        showToast(TEXTS.demoSigninSuccess, 'success');
        setShowCaptcha(false);
        setCaptchaToken(null);
      } catch (error) {
        reportError('Demo sign-in failed', error);
        showToast(getErrorMessage(error), 'error');
        setCaptchaToken(null);
        setShowCaptcha(false);
      } finally {
        setIsSubmitting(false);
      }
    };

    submitDemoLogin();
  }, [captchaToken, isSubmitting, loginDemoWithCaptcha, showToast]);

  return (
    <div className="h-button relative w-full">
      {showCaptcha ? (
        <DemoCaptcha
          siteKey={turnstileSiteKey}
          size={captchaSize}
          onTokenChange={(token) => setCaptchaToken(token)}
        />
      ) : (
        <button
          type="button"
          onClick={startDemoFlow}
          className="font-body h-button w-full bg-white text-base font-medium text-black"
          title={TEXTS.demoSigninButtonTooltip}
          disabled={isSubmitting}
        >
          {isSubmitting ? TEXTS.demoSigninLoading : TEXTS.demoSigninButton}
        </button>
      )}
    </div>
  );
}
