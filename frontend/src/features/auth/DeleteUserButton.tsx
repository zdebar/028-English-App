import { supabaseInstance } from '@/config/supabase.config';
import Metadata from '@/database/models/metadata';
import UserItem from '@/database/models/user-items';
import UserScoreType from '@/database/models/user-scores';
import { clearAllLocalStorageForUser } from '@/utils/storage.utils';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { withSettledSummary } from '@/features/logging/logging.utils';
import ButtonWithModal from '@/features/modal/ButtonWithModal';
import { TEXTS } from '@/locales/cs';
import { TableName } from '@/types/table.types';
import { type JSX } from 'react';
import { useThemeStore } from '../theme/use-theme-store';
import { MenuButtonText } from '@/components/UI/MenuButtonText';
import { reportError, reportInfo } from '../logging/monitoring-handler';
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
    try {
      saveCurrentThemeAsGuest();

      await withSettledSummary(
        [
          UserItem.deleteByUserId(userId),
          Metadata.deleteSyncRow(TableName.UserItems, userId),
          UserScoreType.deleteByUserId(userId),
          Metadata.deleteSyncRow(TableName.UserScores, userId),
        ],
        'Operation failed during local cleanup',
      );

      const { error: deleteError } = await supabaseInstance.rpc('soft_delete_user');

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      showToast(TEXTS.deleteUserSuccessToast, 'success');
      reportInfo(`User ${userId} soft deleted their account`);
    } catch (err) {
      reportError('Error deleting user', err);
      showToast(TEXTS.deleteUserErrorToast, 'error');
    } finally {
      clearAllLocalStorageForUser(userId);
      handleLogout({ skipSync: true, scope: 'global' });
    }
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
