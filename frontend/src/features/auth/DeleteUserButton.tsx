import { supabaseInstance } from '@/config/supabase.config';
import SyncMetadata from '@/database/models/metadata';
import UserItem from '@/database/models/user-items';
import UserLesson from '@/database/models/user-lessons';
import { clearAllLocalStorageForUser } from '@/utils/storage.utils';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { withSettledSummary } from '@/features/logging/logging.utils';
import ButtonWithModal from '@/features/modal/ButtonWithModal';
import { TEXTS } from '@/locales/cs';
import { TableName } from '@/types/table.types';
import { type JSX } from 'react';
import { useThemeStore } from '../theme/use-theme-store';
import { MenuButtonText } from '@/components/UI/MenuButtonText';
import { reportError, reportInfo } from '../logging/logging-handler';
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
  const saveCurrentThemeAsGuest = useThemeStore((state) => state.saveCurrentThemeAsGuest);
  const showToast = useToastStore((state) => state.showToast);

  const handleDelete = async () => {
    if (!userId) return;
    const deletingUserId = userId;

    try {
      const { data: deletionConfirmed, error: deleteError } =
        await supabaseInstance.rpc('hard_delete_user');
      if (deleteError) {
        throw new Error(deleteError.message);
      }
      if (deletionConfirmed !== true) {
        throw new Error('The server did not confirm account deletion.');
      }
    } catch (err) {
      reportError('Error deleting user', err);
      showToast(TEXTS.deleteUserErrorToast, 'error');
      return;
    }

    saveCurrentThemeAsGuest();
    const cleanupSummary = await withSettledSummary(
      [
        UserItem.deleteByUserId(deletingUserId),
        SyncMetadata.deleteSyncRow(TableName.UserItems, deletingUserId),
        SyncMetadata.deleteSyncRow(TableName.UserLessons, deletingUserId),
        UserLesson.removeByUserId(deletingUserId),
      ],
      'Operation failed during local cleanup',
    );
    if (cleanupSummary.failed > 0) {
      reportError('Local account cleanup was incomplete', cleanupSummary.sampleErrors);
    }

    try {
      clearAllLocalStorageForUser(deletingUserId);
    } catch (err) {
      reportError('Failed to clear local account storage', err);
    }

    try {
      await handleLogout({ skipSync: true, scope: 'local' });
    } catch (err) {
      reportError('Failed to finish account logout after deletion', err);
    }

    showToast(TEXTS.deleteUserSuccessToast, 'success');
    reportInfo('User account deletion completed.');
  };

  return (
    <ButtonWithModal
      modalTitle={TEXTS.deleteUserButtonTitle}
      modalText={TEXTS.deleteUserModalText}
      disabled={!userId}
      onConfirm={handleDelete}
      className={className}
      aria-haspopup="dialog"
      title={TEXTS.actionRequiresConfirmation}
    >
      <MenuButtonText>{TEXTS.deleteUserButtonTitle}</MenuButtonText>
    </ButtonWithModal>
  );
}
