import { useState } from 'react';
import { useToastStore } from '@/features/toast/use-toast-store';
import ButtonModal from '../modal/ButtonModal';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { TEXTS } from '@/config/texts';

/**
 * SignoutButton component for signing out the user.
 *
 * @param className - Optional CSS class name to apply to the button.
 */
export default function SignoutButton({ className }: { className?: string }) {
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
    <ButtonModal
      label={TEXTS.signoutButtonTitle}
      isLoading={isLoading}
      modalDescription={TEXTS.signoutModalDescription}
      onConfirm={handleSignout}
      className={className}
    />
  );
}
