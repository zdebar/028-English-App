import { supabaseInstance } from '@/config/supabase.config';
import Metadata from '@/database/models/metadata';
import UserItem from '@/database/models/user-items';
import UserScore from '@/database/models/user-scores';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { useToastStore } from '@/features/toast/use-toast-store';
import { TEXTS } from '@/locales/cs';
import { type JSX } from 'react';
import ButtonWithModal from '../modal/ButtonWithModal';
import { errorHandler } from '../logging/error-handler';
import { useThemeStore } from '../theme/use-theme';
import { useUserStore } from '../dashboard/use-user-store';
import { clearSyncTimes } from '@/components/utils/sync-time';

/**
 * DeleteUserButton component for deleting the current user's account.
 *
 * @param className - Optional CSS class name to apply to the button.
 * @returns The rendered DeleteUserButton component.
 */
export default function DeleteUserButton({ className }: { className?: string }): JSX.Element {
  const userId = useAuthStore((state) => state.userId);
  const showToast = useToastStore((state) => state.showToast);
  const clearTheme = useThemeStore((state) => state.clearTheme);
  const clearUserStats = useUserStore((state) => state.clearUserStats);

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

      // Sync local data before deletion for potential recovery or analytics purposes
      const resultsSync = await Promise.allSettled([
        UserItem.syncUserItemsSinceLastSync(userId),
        UserScore.syncUserScoreSinceLastSync(userId),
      ]);

      resultsSync.forEach((result) => {
        if (result.status === 'rejected') {
          errorHandler('Operation failed', result.reason);
        }
      });

      const resultsDelete = await Promise.allSettled([
        UserItem.deleteAllUserItems(userId),
        Metadata.deleteSyncRow('user_items', userId),
        UserScore.deleteAllUserScores(userId),
        Metadata.deleteSyncRow('user_scores', userId),
        clearTheme(),
        clearUserStats(),
        clearSyncTimes(userId),
      ]);

      resultsDelete.forEach((result) => {
        if (result.status === 'rejected') {
          errorHandler('Operation failed', result.reason);
        }
      });

      showToast(TEXTS.deleteUserSuccessToast, 'success');
      await supabaseInstance.auth.signOut();
    } catch (error) {
      showToast(TEXTS.deleteUserErrorToast, 'error');
      errorHandler('Delete User Error', error);
    }
  };

  return (
    <ButtonWithModal
      modalTitle={TEXTS.deleteUserButtonTitle}
      modalText={TEXTS.deleteUserModalText}
      disabled={!userId}
      onConfirm={handleDelete}
      className={className}
    >
      <p className="font-bold">{TEXTS.deleteUserButtonTitle}</p>
    </ButtonWithModal>
  );
}
