import { useAuthStore } from '@/features/auth/use-auth-store';
import ButtonWithModal from '@/features/modal/ButtonWithModal';
import { TEXTS } from '@/locales/cs';
import type { JSX } from 'react';
import { useThemeStore } from '../theme/use-theme-store';
import { MenuButtonText } from '@/components/UI/MenuButtonText';
import { errorHandler } from '../logging/error-handler';
import { useToastStore } from '../toast/use-toast-store';

type SignoutButtonProps = Readonly<{
  className?: string;
}>;

/**
 * SignoutButton component for signing out the user.
 *
 * @param className - Optional CSS class name to apply to the button.
 * @returns The rendered SignoutButton component.
 */
export default function SignoutButton({ className }: SignoutButtonProps): JSX.Element {
  const userId = useAuthStore((state) => state.userId);
  const handleLogout = useAuthStore((state) => state.handleLogout);
  const saveCurrentThemeAsGuest = useThemeStore((state) => state.saveCurrentThemeAsGuest);
  const showToast = useToastStore((state) => state.showToast);

  const handleSignout = async () => {
    if (!userId) return;
    try {
      saveCurrentThemeAsGuest();
      await handleLogout();
    } catch (err) {
      showToast(TEXTS.signoutError, 'error');
      errorHandler('Error signing out', err);
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
      <MenuButtonText>{TEXTS.signoutButtonTitle}</MenuButtonText>
    </ButtonWithModal>
  );
}
