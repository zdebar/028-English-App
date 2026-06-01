import { useCallback, useState, useRef, type JSX } from 'react';
import SigninButton from '@/features/auth/SigninButton';
import { loginAnonymous } from '@/features/auth/anonymous-auth-service';
import { useToastStore } from '@/features/toast/use-toast-store';
import { reportError } from '@/features/logging/monitoring-handler';
import { TEXTS } from '@/locales/cs';
import HCaptcha from '@hcaptcha/react-hcaptcha';

const CAPTCHA_SITE_KEY = import.meta.env.VITE_CAPTCHA_SITE_KEY!;

export default function AnonymousSigninButton(): JSX.Element {
  const showToast = useToastStore((s) => s.showToast);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const captcha = useRef<HCaptcha>(null);

  const startAnonymous = useCallback(
    async (token?: string) => {
      if (!token) return;

      if (isSubmitting) return;
      setIsSubmitting(true);

      try {
        await loginAnonymous({ captchaToken: token });
      } catch (err) {
        reportError('Anonymous sign-in failed', err);
        showToast(TEXTS.authInitErrorToast, 'error');
      } finally {
        setIsSubmitting(false);
        setShowCaptcha(false);
        captcha.current?.resetCaptcha();
      }
    },
    [isSubmitting, showToast],
  );

  if (showCaptcha) {
    return (
      <div className="mx-auto">
        <HCaptcha
          ref={captcha}
          sitekey={CAPTCHA_SITE_KEY}
          onVerify={(token) => {
            startAnonymous(token);
          }}
          onExpire={() => {
            setShowCaptcha(false);
          }}
          onError={() => {
            setShowCaptcha(false);
            showToast(TEXTS.authInitErrorToast, 'error');
          }}
        />
      </div>
    );
  }

  return (
    <SigninButton
      isSubmitting={isSubmitting}
      onClick={() => setShowCaptcha(true)}
      title={TEXTS.anonymousSigninTooltip}
      label={TEXTS.anonymousSigninButton}
      loadingLabel={TEXTS.anonymousSigninLoading}
    />
  );
}
