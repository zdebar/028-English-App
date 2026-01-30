import { useToastStore } from '@/features/toast/use-toast-store';
import ButtonWithModal from '../modal/ButtonWithModal';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { TEXTS } from '@/locales/cs';
import type { JSX } from 'react';

interface SignoutButtonProps {
  className?: string;
}

/**
 * SignoutButton component for signing out the user.
 *
 * @param className - Optional CSS class name to apply to the button.
 * @returns {JSX.Element} The rendered SignoutButton component.
 */
export default function SignoutButton({ className }: SignoutButtonProps): JSX.Element {
  const userId = useAuthStore((state) => state.userId);
  const handleLogout = useAuthStore((state) => state.handleLogout);
  const showToast = useToastStore((state) => state.showToast);

  const handleSignout = async () => {
    try {
      await handleLogout();
      showToast(TEXTS.signoutSuccess, 'success');
    } catch (error) {
      console.error('Error on user logout:', error);
      showToast(TEXTS.signoutError, 'error');
    }
  };

  return (
    <ButtonWithModal
      buttonText={TEXTS.signoutButtonTitle}
      disabled={!userId}
      modalDescription={TEXTS.signoutModalDescription}
      onConfirm={handleSignout}
      className={className}
    />
  );
}
