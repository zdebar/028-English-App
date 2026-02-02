import { supabaseInstance } from '@/config/supabase.config';
import Metadata from '@/database/models/metadata';
import UserItem from '@/database/models/user-items';
import UserScore from '@/database/models/user-scores';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { useToastStore } from '@/features/toast/use-toast-store';
import { TEXTS } from '@/locales/cs';
import { type JSX } from 'react';
import ButtonWithModal from '../modal/ButtonWithModal';
import { errorHandler } from '../error-handler/error-handler';

/**
 * DeleteUserButton component for deleting the current user's account.
 *
 * @param className - Optional CSS class name to apply to the button.
 * @returns The rendered DeleteUserButton component.
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
          errorHandler(result.reason, 'Operation failed');
        }
      });

      showToast(TEXTS.deleteUserSuccessToast, 'success');
      await supabaseInstance.auth.signOut();
    } catch (error) {
      showToast(TEXTS.deleteUserErrorToast, 'error');
      errorHandler(error, 'Delete User Error');
    }
  };

  return (
    <ButtonWithModal
      buttonText={TEXTS.deleteUserButtonTitle}
      disabled={!userId}
      onConfirm={handleDelete}
      className={className}
    >
      <p>{TEXTS.deleteUserModalDescription}</p>
    </ButtonWithModal>
  );
}
