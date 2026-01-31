import { supabaseInstance } from '@/config/supabase.config';
import Metadata from '@/database/models/metadata';
import UserItem from '@/database/models/user-items';
import UserScore from '@/database/models/user-scores';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { useToastStore } from '@/features/toast/use-toast-store';
import { TEXTS } from '@/locales/cs';
import { type JSX } from 'react';
import ButtonWithModal from '../modal/ButtonWithModal';

/**
 * DeleteUserButton component for deleting the current user's account.
 *
 * @param className - Optional CSS class name to apply to the button.
 * @returns The rendered DeleteUserButton component.
 * @throws Doesn't throw errors. Displays a toast notification on success or failure of deleting the user.
 */
export default function DeleteUserButton({ className }: { className?: string }): JSX.Element {
  const userId = useAuthStore((state) => state.userId);
  const showToast = useToastStore((state) => state.showToast);

  const handleDelete = async () => {
    try {
      if (!userId) return;

      // Delete user from Supabase Auth (admin API)
      const { error: deleteError } = await supabaseInstance.functions.invoke('delete-user', {
        body: { userId },
      });

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      const results = await Promise.allSettled([
        UserItem.syncUserItemsData(userId),
        UserScore.syncUserScoreData(userId),
        UserItem.deleteAllUserItems(userId),
        Metadata.deleteSyncRow('user_items', userId),
        Metadata.deleteSyncRow('user_scores', userId),
      ]);

      results.forEach((result) => {
        if (result.status === 'rejected') {
          console.error('Operation failed:', result.reason);
        }
      });

      showToast(TEXTS.deleteUserSuccessToast, 'success');
      await supabaseInstance.auth.signOut();
    } catch (error) {
      console.error('Error deleting user:', error);
      showToast(TEXTS.deleteUserErrorToast, 'error');
    }
  };

  return (
    <ButtonWithModal
      buttonText={TEXTS.deleteUserButtonTitle}
      disabled={!userId}
      modalDescription={TEXTS.deleteUserModalDescription}
      onConfirm={handleDelete}
      className={className}
    />
  );
}
