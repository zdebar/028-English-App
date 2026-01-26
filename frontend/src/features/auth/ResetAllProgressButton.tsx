import { TEXTS } from '@/config/texts';
import UserItem from '@/database/models/user-items';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { useToastStore } from '@/features/toast/use-toast-store';
import { useState } from 'react';
import ButtonModal from '../modal/ButtonModal';

/**
 * ResetAllProgressButton component for resetting all user progress.
 *
 * @param className - Optional CSS class name to apply to the button.
 */
export default function ResetAllProgressButton({ className }: { className?: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const { userId } = useAuthStore();
  const { showToast } = useToastStore();

  const handleReset = async () => {
    setIsLoading(true);
    try {
      if (!userId) return;
      await UserItem.resetAllUserItems(userId);
      showToast(TEXTS.eraseSuccessToast, 'success');
    } catch (error) {
      console.error('Error clearing all user items:', error);
      showToast(TEXTS.failureToast, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ButtonModal
      label={TEXTS.eraseLanguageProgress}
      isLoading={isLoading}
      modalDescription={TEXTS.eraseDescription}
      onConfirm={handleReset}
      className={className}
    />
  );
}
