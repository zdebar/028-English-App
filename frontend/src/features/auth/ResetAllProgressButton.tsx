import { TEXTS } from '@/locales/cs';
import UserItem from '@/database/models/user-items';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { useToastStore } from '@/features/toast/use-toast-store';
import ModalButton from '../modal/ModalButton';
import type { JSX } from 'react';
import { errorHandler } from '@/features/logging/error-handler';

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
    if (!userId) return;

    try {
      await UserItem.resetAllUserItems(userId);
      showToast(TEXTS.resetProgressSuccessToast, 'success');
    } catch (error) {
      showToast(TEXTS.resetProgressErrorToast, 'error');
      errorHandler('Reset Progress Error', error);
    }
  };

  return (
    <ModalButton
      modalTitle={TEXTS.resetAllProgressButtonTitle}
      modalText={TEXTS.resetAllProgressModalText}
      disabled={!userId}
      onConfirm={handleReset}
      className={className}
    >
      {TEXTS.resetAllProgressButtonTitle}
    </ModalButton>
  );
}
