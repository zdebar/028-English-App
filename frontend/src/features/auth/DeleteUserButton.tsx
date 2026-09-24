import { supabaseInstance } from '@/config/supabase.config';
import Metadata from '@/database/models/metadata';
import UserItem from '@/database/models/user-items';
import PracticeSession from '@/database/models/practice-sessions';
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
    const deletingUserId = userId;

    try {
      const { error: deleteError } = await supabaseInstance.rpc('hard_delete_user');
      if (deleteError) {
        throw new Error(deleteError.message);
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
        Metadata.deleteSyncRow(TableName.UserItems, deletingUserId),
        PracticeSession.deleteByUserId(deletingUserId),
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
      await handleLogout({ skipSync: true, skipRemoteSignOut: true });
    } catch (err) {
      reportError('Failed to finish account logout after deletion', err);
    }

    showToast(TEXTS.deleteUserSuccessToast, 'success');
    reportInfo(`User ${deletingUserId} hard deleted their account`);
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
