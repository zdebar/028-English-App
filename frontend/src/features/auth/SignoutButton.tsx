import { useAuthStore } from '@/features/auth/use-auth-store';
import ModalButton from '@/features/modal/ModalButton';
import { TEXTS } from '@/locales/cs';
import type { JSX } from 'react';
import { useThemeStore } from '../theme/use-theme-store';
import { MenuButtonText } from '@/components/UI/MenuButtonText';

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

  const handleSignout = async () => {
    if (!userId) return;
    saveCurrentThemeAsGuest();
    await handleLogout();
  };

  return (
    <ModalButton
      modalTitle={TEXTS.signoutButtonTitle}
      modalText={TEXTS.signoutModalText}
      successToastText={TEXTS.signoutSuccess}
      errorToastText={TEXTS.signoutError}
      disabled={!userId}
      onConfirm={handleSignout}
      className={className}
    >
      <MenuButtonText>{TEXTS.signoutButtonTitle}</MenuButtonText>
    </ModalButton>
  );
}
