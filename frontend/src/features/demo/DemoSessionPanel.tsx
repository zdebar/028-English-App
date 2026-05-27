import { useCallback, useEffect, useMemo, useState, type JSX } from 'react';
import DemoCaptcha from '@/features/demo/DemoCaptcha';
import { loginDemoWithCaptcha } from '@/features/demo/demo-auth-service';
import { getDemoSigninErrorMessage } from '@/features/demo/demo-signin-error';
import { TEXTS } from '@/locales/cs';
import { useToastStore } from '@/features/toast/use-toast-store';
import { reportError } from '@/features/logging/monitoring-handler';

type DemoSessionPanelProps = Readonly<{
  onCaptchaVisibilityChange?: (visible: boolean) => void;
}>;

export default function DemoSessionPanel({
  onCaptchaVisibilityChange,
}: DemoSessionPanelProps): JSX.Element {
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
    onCaptchaVisibilityChange?.(showCaptcha);

    return () => {
      onCaptchaVisibilityChange?.(false);
    };
  }, [onCaptchaVisibilityChange, showCaptcha]);

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
        showToast(getDemoSigninErrorMessage(error), 'error');
        setCaptchaToken(null);
        setShowCaptcha(false);
      } finally {
        setIsSubmitting(false);
      }
    };

    submitDemoLogin();
  }, [captchaToken, isSubmitting, showToast]);

  return (
    <div className="relative w-full">
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
          className="font-body h-button bg-signin-button hover:bg-signin-button-hover focus-visible:bg-signin-button-hover w-full text-base font-medium text-black"
          title={TEXTS.demoSigninButtonTooltip}
          disabled={isSubmitting}
        >
          {isSubmitting ? TEXTS.demoSigninLoading : TEXTS.demoSigninButton}
        </button>
      )}
    </div>
  );
}
