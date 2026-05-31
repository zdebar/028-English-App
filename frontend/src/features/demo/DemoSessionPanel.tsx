import { useCallback, useState, type JSX } from 'react';
import { loginDemo } from '@/features/demo/demo-auth-service';
import { getDemoSigninErrorMessage } from '@/features/demo/demo-signin-error';
import { TEXTS } from '@/locales/cs';
import { useToastStore } from '@/features/toast/use-toast-store';
import { reportError } from '@/features/logging/monitoring-handler';

export default function DemoSessionPanel(): JSX.Element {
  const showToast = useToastStore((state) => state.showToast);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const startDemoFlow = useCallback(() => {
    if (isSubmitting) {
      return;
    }
    setIsSubmitting(true);
    loginDemo()
      .then(() => {
        showToast(TEXTS.demoSigninSuccess, 'success');
      })
      .catch((error) => {
        reportError('Demo sign-in failed', error);
        showToast(getDemoSigninErrorMessage(error), 'error');
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  }, [isSubmitting, showToast]);

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={startDemoFlow}
        className="font-body h-button bg-signin-button hover:bg-signin-button-hover focus-visible:bg-signin-button-hover w-full text-base font-medium text-black"
        title={TEXTS.demoSigninButtonTooltip}
        disabled={isSubmitting}
      >
        {isSubmitting ? TEXTS.demoSigninLoading : TEXTS.demoSigninButton}
      </button>
    </div>
  );
}
