import { supabaseInstance } from '@/config/supabase.config';
import Metadata from '@/database/models/metadata';
import UserItem from '@/database/models/user-items';
import UserScore from '@/database/models/user-scores';
import { TableName } from '@/types/local.types';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { useToastStore } from '@/features/toast/use-toast-store';
import { TEXTS } from '@/locales/cs';
import { type JSX } from 'react';
import ModalButton from '../modal/ModalButton';
import { errorHandler } from '../logging/error-handler';
import { useThemeStore } from '../theme/use-theme-store';
import { useUserStore } from '../user-stats/use-user-store';
import { clearSyncTimes } from '@/database/utils/sync-time.utils';
import { logRejectedResults } from '@/features/logging/logging.utils.ts';

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
    if (!userId) return;

    try {
      const { error: deleteError } = await supabaseInstance.functions.invoke('delete-user', {
        body: { userId },
      });

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      const resultsDelete = await Promise.allSettled([
        UserItem.deleteAllItems(userId),
        Metadata.deleteSyncRow(TableName.UserItems, userId),
        UserScore.deleteAllScores(userId),
        Metadata.deleteSyncRow(TableName.UserScores, userId),
        clearTheme(userId),
        clearUserStats(),
        clearSyncTimes(userId),
      ]);
      logRejectedResults(resultsDelete, 'Operation failed during local cleanup');

      showToast(TEXTS.deleteUserSuccessToast, 'success');
      await supabaseInstance.auth.signOut();
    } catch (error) {
      showToast(TEXTS.deleteUserErrorToast, 'error');
      errorHandler('Delete User Error', error);
    }
  };

  return (
    <div>
      <ModalButton
        modalTitle={TEXTS.deleteUserButtonTitle}
        modalText={TEXTS.deleteUserModalText}
        disabled={!userId}
        onConfirm={handleDelete}
        className={className}
      >
        {TEXTS.deleteUserButtonTitle}
      </ModalButton>
    </div>
  );
}
