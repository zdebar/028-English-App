import { useState } from 'react';
import { useToastStore } from '@/features/toast/use-toast-store';
import ButtonAsyncModal from '../../components/UI/buttons/ButtonAsyncModal';
import { useAuthStore } from '@/features/auth/use-auth-store';

/**
 * SignoutButton component for signing out the user.
 * @returns A button that opens a confirmation modal and handles user signout with loading feedback.
 */
export default function SignoutButton() {
  const { handleLogout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToastStore();

  const handleSignout = async () => {
    setIsLoading(true);
    try {
      await handleLogout();
      showToast('Úspěšně jste se odhlásili.', 'success');
    } catch (error) {
      console.error('Error on user logout:', error);
      showToast('Nastala chyba při odhlašování. Zkuste to prosím později.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ButtonAsyncModal
      message="Odhlásit se"
      isLoading={isLoading}
      loadingMessage="Probíhá odhlašování..."
      modalTitle="Potvrzení odhlášení"
      modalDescription="Opravdu se chcete odhlásit?"
      onConfirm={handleSignout}
      className="shape-button-rectangular color-button grow-0"
    />
  );
}
