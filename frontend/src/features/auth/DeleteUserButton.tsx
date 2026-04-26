import { supabaseInstance } from '@/config/supabase.config';
import Metadata from '@/database/models/metadata';
import UserItem from '@/database/models/user-items';
import UserScore from '@/database/models/user-scores';
import { clearSyncTimes } from '@/database/utils/sync-time.utils';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { errorHandler } from '@/features/logging/error-handler';
import { logRejectedResults } from '@/features/logging/logging.utils.ts';
import ModalButton from '@/features/modal/ModalButton';
import { useToastStore } from '@/features/toast/use-toast-store';
import { TEXTS } from '@/locales/cs';
import { TableName } from '@/types/local.types';
import { type JSX } from 'react';
import { useThemeStore } from '../theme/use-theme-store';

type DeleteUserButtonProps = Readonly<{
  className?: string;
}>;

/**
 * DeleteUserButton component for deleting the current user's account.
 *
 * @param className - Optional CSS class name to apply to the button.
 * @returns The rendered DeleteUserButton component.
 */
export default function DeleteUserButton({ className }: DeleteUserButtonProps): JSX.Element {
  const userId = useAuthStore((state) => state.userId);
  const handleLogout = useAuthStore((state) => state.handleLogout);
  const showToast = useToastStore((state) => state.showToast);
  const clearTheme = useThemeStore((state) => state.clearTheme);
  const saveCurrentThemeAsGuest = useThemeStore((state) => state.saveCurrentThemeAsGuest);

  const handleDelete = async () => {
    if (!userId) return;

    try {
      saveCurrentThemeAsGuest();

      const resultsDelete = await Promise.allSettled([
        UserItem.deleteAllByUserId(userId),
        Metadata.deleteSyncRow(TableName.UserItems, userId),
        UserScore.deleteAllScores(userId),
        Metadata.deleteSyncRow(TableName.UserScores, userId),
        Promise.resolve(clearTheme(userId)),
        Promise.resolve(clearSyncTimes(userId)),
      ]);
      logRejectedResults(resultsDelete, 'Operation failed during local cleanup');

      const { error: deleteError } = await supabaseInstance.functions.invoke('delete-user', {
        body: { userId },
      });

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      await handleLogout({ skipSync: true, skipRemoteSignOut: true });
      showToast(TEXTS.deleteUserSuccessToast, 'success');
    } catch (error) {
      showToast(TEXTS.deleteUserErrorToast, 'error');
      errorHandler('Delete User Error', error);
    }
  };

  return (
    <ModalButton
      modalTitle={TEXTS.deleteUserButtonTitle}
      modalText={TEXTS.deleteUserModalText}
      disabled={!userId}
      onConfirm={handleDelete}
      className={className}
    >
      <p className="profile-menu-button">{TEXTS.deleteUserButtonTitle}</p>
    </ModalButton>
  );
}
