import { supabaseInstance } from '@/config/supabase.config';
import { TEXTS } from '@/config/texts';
import Metadata from '@/database/models/metadata';
import UserItem from '@/database/models/user-items';
import UserScore from '@/database/models/user-scores';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { useToastStore } from '@/features/toast/use-toast-store';
import { useState } from 'react';
import ButtonAsyncModal from '../../components/UI/buttons/ButtonAsyncModal';

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

      try {
        await UserItem.syncUserItemsData(userId); // Sync before deletion, for potential future recovery
        await UserScore.syncUserScoreData(userId);
        await UserItem.deleteAllUserItems(userId);
        await Metadata.deleteSyncRow('user_items', userId);
        await Metadata.deleteSyncRow('user_scores', userId);
      } catch (cleanupError) {
        console.error('Local cleanup error after user deletion:', cleanupError);
      }

      showToast(TEXTS.deleteUserSuccessToast, 'success');
      await supabaseInstance.auth.signOut();
    } catch (error) {
      console.error('Error deleting user:', error);
      showToast(TEXTS.failureToast, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ButtonAsyncModal
      buttonTitle={TEXTS.deleteUserButtonTitle}
      disabled={isLoading || !userId}
      isLoading={isLoading}
      modalDescription={TEXTS.deleteUserModalDescription}
      onConfirm={handleDelete}
      className="button-rectangular button-color w-full grow-0"
    />
  );
}
