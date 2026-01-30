import { TEXTS } from '@/locales/cs';
import UserItem from '@/database/models/user-items';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { useToastStore } from '@/features/toast/use-toast-store';
import ButtonWithModal from '../modal/ButtonWithModal';
import type { JSX } from 'react';

interface ResetAllProgressButtonProps {
  className?: string;
}

/**
 * ResetAllProgressButton component for resetting all user progress.
 *
 * @param className - Optional CSS class name to apply to the button.
 * @return {JSX.Element} The rendered ResetAllProgressButton component.
 * @throws No
 */
export default function ResetAllProgressButton({
  className,
}: ResetAllProgressButtonProps): JSX.Element {
  const userId = useAuthStore((state) => state.userId);
  const showToast = useToastStore((state) => state.showToast);

  const handleReset = async () => {
    try {
      if (!userId) return;
      await UserItem.resetAllUserItems(userId);
      showToast(TEXTS.resetAllProgressSuccessToast, 'success');
    } catch (error) {
      console.error('Error clearing all user items:', error);
      showToast(TEXTS.resetAllProgressErrorToast, 'error');
    }
  };

  return (
    <ButtonWithModal
      buttonText={TEXTS.resetAllProgressButtonTitle}
      modalDescription={TEXTS.resetAllProgressModalDescription}
      disabled={!userId}
      onConfirm={handleReset}
      className={className}
    />
  );
}
