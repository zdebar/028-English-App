import { useState } from 'react';
import { useToastStore } from '@/features/toast/use-toast-store';
import ButtonAsyncModal from '../../components/UI/buttons/ButtonAsyncModal';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { TEXTS } from '@/config/texts';

/**
 * SignoutButton component for signing out the user.
 */
export default function SignoutButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { handleLogout } = useAuthStore();
  const { showToast } = useToastStore();

  const handleSignout = async () => {
    setIsLoading(true);
    try {
      await handleLogout();
      showToast(TEXTS.signoutSuccessToast, 'success');
    } catch (error) {
      console.error('Error on user logout:', error);
      showToast(TEXTS.failureToast, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ButtonAsyncModal
      buttonTitle={TEXTS.signoutButtonTitle}
      isLoading={isLoading}
      modalDescription={TEXTS.signoutModalDescription}
      onConfirm={handleSignout}
      className="button-rectangular color-button w-full grow-0"
    />
  );
}
