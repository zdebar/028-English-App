import { useAuthStore } from '@/features/auth/use-auth-store';
import { useToastStore } from '@/features/toast/use-toast-store';
import { TEXTS } from '@/locales/cs';
import type { JSX } from 'react';
import ButtonWithModal from '../modal/ButtonWithModal';
import { errorHandler } from '../error-handler/error-handler';

/**
 * SignoutButton component for signing out the user.
 *
 * @param className - Optional CSS class name to apply to the button.
 * @returns The rendered SignoutButton component.
 */
export default function SignoutButton({ className }: { className?: string }): JSX.Element {
  const userId = useAuthStore((state) => state.userId);
  const handleLogout = useAuthStore((state) => state.handleLogout);
  const showToast = useToastStore((state) => state.showToast);

  const handleSignout = async () => {
    try {
      if (!userId) return;
      await handleLogout();
      showToast(TEXTS.signoutSuccess, 'success');
    } catch (error) {
      showToast(TEXTS.signoutError, 'error');
      errorHandler(error, 'Signout Error');
    }
  };

  return (
    <ButtonWithModal
      buttonText={TEXTS.signoutButtonTitle}
      disabled={!userId}
      onConfirm={handleSignout}
      className={className}
    >
      <p>{TEXTS.signoutModalDescription}</p>
    </ButtonWithModal>
  );
}
