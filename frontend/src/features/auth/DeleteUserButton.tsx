import { supabaseInstance } from '@/config/supabase.config';
import Metadata from '@/database/models/metadata';
import UserItem from '@/database/models/user-items';
import UserScoreType from '@/database/models/user-scores';
import { clearSyncTimes } from '@/database/utils/sync-time.utils';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { logRejectedResults } from '@/features/logging/logging.utils.ts';
import ModalButton from '@/features/modal/ModalButton';
import { TEXTS } from '@/locales/cs';
import { TableName } from '@/types/table.types';
import { type JSX } from 'react';
import { useThemeStore } from '../theme/use-theme-store';
import { MenuButtonText } from '@/components/UI/MenuButtonText';
import { errorHandler } from '../logging/error-handler';
import { infoHandler } from '../logging/info-handler';
import { useToastStore } from '../toast/use-toast-store';

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
  const clearTheme = useThemeStore((state) => state.clearTheme);
  const saveCurrentThemeAsGuest = useThemeStore((state) => state.saveCurrentThemeAsGuest);
  const showToast = useToastStore((state) => state.showToast);

  const handleDelete = async () => {
    if (!userId) return;
    try {
      saveCurrentThemeAsGuest();

      const resultsDelete = await Promise.allSettled([
        UserItem.deleteByUserId(userId),
        Metadata.deleteSyncRow(TableName.UserItems, userId),
        UserScoreType.deleteByUserId(userId),
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

      showToast(TEXTS.deleteUserSuccessToast, 'success');
      infoHandler(`User ${userId} deleted their account`);
    } catch (err) {
      errorHandler('Error deleting user', err);
      showToast(TEXTS.deleteUserErrorToast, 'error');
    } finally {
      handleLogout({ skipSync: true, skipRemoteSignOut: true });
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
      <MenuButtonText>{TEXTS.deleteUserButtonTitle}</MenuButtonText>
    </ModalButton>
  );
}
