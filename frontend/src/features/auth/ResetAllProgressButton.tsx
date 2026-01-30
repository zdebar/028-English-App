import { TEXTS } from '@/config/texts.config';
import UserItem from '@/database/models/user-items';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { useToastStore } from '@/features/toast/use-toast-store';
import ButtonWithModal from '../modal/ButtonWithModal';

/**
 * ResetAllProgressButton component for resetting all user progress.
 *
 * @param className - Optional CSS class name to apply to the button.
 */
export default function ResetAllProgressButton({ className }: { className?: string }) {
  const { userId } = useAuthStore();
  const { showToast } = useToastStore();

  const handleReset = async () => {
    try {
      if (!userId) return;
      await UserItem.resetAllUserItems(userId);
      showToast(TEXTS.eraseSuccessToast, 'success');
    } catch (error) {
      console.error('Error clearing all user items:', error);
      showToast(TEXTS.failureToast, 'error');
    }
  };

  return (
    <ButtonWithModal
      buttonText={TEXTS.eraseLanguageProgress}
      modalDescription={TEXTS.eraseDescription}
      disabled={!userId}
      onConfirm={handleReset}
      className={className}
    />
  );
}
