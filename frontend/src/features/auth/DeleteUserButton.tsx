import { useState } from 'react';
import { useToastStore } from '@/features/toast/use-toast-store';
import ButtonAsyncModal from '../../components/UI/buttons/ButtonAsyncModal';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { supabaseInstance } from '@/config/supabase.config';
import UserItem from '@/database/models/user-items';
import Metadata from '@/database/models/metadata';
import UserScore from '@/database/models/user-scores';

/**
 * DeleteUserButton component for deleting the current user's account.
 */
export default function DeleteUserButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { userId } = useAuthStore();
  const { showToast } = useToastStore();

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      if (!userId) return;

      // Delete user from Supabase Auth (admin API)
      const { error: deleteError } = await supabaseInstance.functions.invoke('delete-user', {
        body: { userId },
      });
      if (deleteError) {
        throw deleteError;
      }

      // Set deleted_at in table users
      const response = await supabaseInstance
        .from('users')
        .update({
          deleted_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (response.error) {
        throw response.error;
      }

      await UserItem.syncUserItemsData(userId);
      await UserScore.syncUserScoreData(userId);
      await UserItem.deleteAllUserItems(userId);
      await Metadata.deleteSyncRow('user_items', userId);
      await Metadata.deleteSyncRow('user_scores', userId);

      showToast('Váš uživatelský účet byl úspěšně smazán.', 'success');
      await supabaseInstance.auth.signOut();
    } catch (error) {
      console.error('Error deleting user:', error);
      showToast('Nastala chyba při mazání uživatelského účtu. Zkuste to prosím později.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ButtonAsyncModal
      message="Smazat uživatelský účet"
      loadingMessage="Probíhá mazání..."
      isLoading={isLoading}
      modalTitle="Potvrzení mazání uživatelského účtu"
      modalDescription="Opravdu chcete smazat uživatelský účet? Vaše data budou uchována příštích 30 dní, poté budou nenávratně smazána. Před smazáním můžete kdykoliv obnovit svůj účet obětovným přihlášením."
      onConfirm={handleDelete}
      className="shape-button-rectangular color-button grow-0"
    />
  );
}
