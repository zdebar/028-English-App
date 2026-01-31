import { TEXTS } from '@/locales/cs';
import UserItem from '@/database/models/user-items';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { useToastStore } from '@/features/toast/use-toast-store';
import ButtonWithModal from '../modal/ButtonWithModal';
import type { JSX } from 'react';

/**
 * ResetAllProgressButton component for resetting all user progress.
 *
 * @param className - Optional CSS class name to apply to the button.
 * @returns The rendered ResetAllProgressButton component.
 * @throws Doesn't throw errors. Displays a toast notification on success or failure of resetting progress.
 */
export default function ResetAllProgressButton({ className }: { className?: string }): JSX.Element {
  const userId = useAuthStore((state) => state.userId);
  const showToast = useToastStore((state) => state.showToast);

  const handleReset = async () => {
    try {
      if (!userId) return;
      await UserItem.resetAllUserItems(userId);
      showToast(TEXTS.resetAllProgressSuccessToast, 'success');
    } catch (error) {
      console.error('Error clearing all user items:', error);
      showToast(TEXTS.resetProgressErrorToast, 'error');
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
