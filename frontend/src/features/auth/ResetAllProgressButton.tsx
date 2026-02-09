import { TEXTS } from '@/locales/cs';
import UserItem from '@/database/models/user-items';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { useToastStore } from '@/features/toast/use-toast-store';
import ButtonWithModal from '../modal/ButtonWithModal';
import type { JSX } from 'react';
import { errorHandler } from '@/features/error-handler/error-handler';

/**
 * ResetAllProgressButton component for resetting all user progress.
 *
 * @param className - Optional CSS class name to apply to the button.
 * @returns The rendered ResetAllProgressButton component.
 */
export default function ResetAllProgressButton({ className }: { className?: string }): JSX.Element {
  const userId = useAuthStore((state) => state.userId);
  const showToast = useToastStore((state) => state.showToast);

  const handleReset = async () => {
    try {
      if (!userId) return;
      await UserItem.resetAllUserItems(userId);
      showToast(TEXTS.resetProgressSuccessToast, 'success');
    } catch (error) {
      showToast(TEXTS.resetProgressErrorToast, 'error');
      errorHandler('Reset Progress Error', error);
    }
  };

  return (
    <ButtonWithModal
      buttonText={TEXTS.resetAllProgressButtonTitle}
      disabled={!userId}
      onConfirm={handleReset}
      className={className}
    >
      <p>{TEXTS.resetAllProgressModalDescription}</p>
    </ButtonWithModal>
  );
}
