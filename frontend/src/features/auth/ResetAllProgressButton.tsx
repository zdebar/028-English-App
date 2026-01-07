import { useState } from 'react';
import UserItem from '@/database/models/user-items';
import { useToastStore } from '@/features/toast/use-toast-store';
import ButtonAsyncModal from '../../components/UI/buttons/ButtonAsyncModal';
import { useAuthStore } from '@/features/auth/use-auth-store';

/**
 * ResetAllProgressButton component for resetting all user progress.
 * @returns A button that opens a confirmation modal and resets user progress with loading feedback.
 */
export default function ResetAllProgressButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { userId } = useAuthStore();
  const { showToast } = useToastStore();

  const handleReset = async () => {
    setIsLoading(true);
    try {
      if (!userId) return;
      if (await UserItem.resetsAllUserItems(userId)) {
        showToast('Váš pokrok byl úspěšně resetován.', 'success');
      } else {
        showToast('Žádný pokrok k resetování.', 'info');
      }
    } catch (error) {
      console.error('Error clearing all user items:', error);
      showToast('Nastala chyba při resetování pokroku. Zkuste to prosím později.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ButtonAsyncModal
      message="Resetovat veškerý pokrok"
      loadingMessage="Probíhá resetování..."
      isLoading={isLoading}
      modalTitle="Potvrzení resetu"
      modalDescription="Opravdu chcete vymazat veškerý progress? Změna již nepůjde vrátit."
      onConfirm={handleReset}
      className="shape-button-rectangular color-button grow-0"
    />
  );
}
