import { useState } from 'react';
import { useToastStore } from '@/features/toast/use-toast-store';
import ButtonAsyncModal from '../../components/UI/buttons/ButtonAsyncModal';
import { useAuthStore } from '@/features/auth/use-auth-store';

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
      buttonTitle="Odhlásit se"
      isLoading={isLoading}
      loadingMessage="Probíhá odhlašování..."
      modalTitle="Potvrzení odhlášení"
      modalDescription="Opravdu se chcete odhlásit?"
      onConfirm={handleSignout}
      className="button-rectangular color-button grow-0"
    />
  );
}
