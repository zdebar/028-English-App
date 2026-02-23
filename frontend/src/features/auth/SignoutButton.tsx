import { useAuthStore } from '@/features/auth/use-auth-store';
import { errorHandler } from '@/features/logging/error-handler';
import ButtonWithModal from '@/features/modal/ButtonWithModal';
import { useToastStore } from '@/features/toast/use-toast-store';
import { TEXTS } from '@/locales/cs';
import type { JSX } from 'react';

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
      errorHandler('Signout Error', error);
    }
  };

  return (
    <ButtonWithModal
      modalTitle={TEXTS.signoutButtonTitle}
      modalText={TEXTS.signoutModalText}
      disabled={!userId}
      onConfirm={handleSignout}
      className={className}
    >
      <p className="font-bold">{TEXTS.signoutButtonTitle}</p>
    </ButtonWithModal>
  );
}
