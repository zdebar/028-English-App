import { useAuthStore } from '@/features/auth/use-auth-store';
import { TEXTS } from '@/locales/cs';
import { type JSX } from 'react';
import { audioSync, dataSync } from '@/database/utils/data-sync.utils';
import { logRejectedResults } from '../logging/logging.utils';
import ButtonWithModal from '../modal/ButtonWithModal';
import { errorHandler } from '../logging/error-handler';
import { useToastStore } from '../toast/use-toast-store';

type SyncButtonProps = Readonly<{
  className?: string;
}>;

/**
 * SyncButton component for synchronizing the current user's data.
 *
 * @param className - Optional CSS class name to apply to the button.
 * @returns The rendered SyncButton component.
 */
export default function SyncButton({ className }: SyncButtonProps): JSX.Element {
  const userId = useAuthStore((state) => state.userId);
  const showToast = useToastStore((state) => state.showToast);

  const handleSync = async () => {
    if (!userId) return;
    try {
      const userResults = await Promise.allSettled([dataSync(userId, true), audioSync(userId)]);
      const isError = logRejectedResults(userResults, 'Data synchronization error:');
      if (isError) throw new Error('Data synchronization error');
      showToast(TEXTS.dataSyncSuccess, 'success');
    } catch (err) {
      showToast(TEXTS.dataSyncError, 'error');
      errorHandler('Error synchronizing data', err);
    }
  };

  return (
    <ButtonWithModal
      onConfirm={handleSync}
      className={className}
      disabled={!userId}
      title={TEXTS.dataSyncTooltip}
      modalTitle={TEXTS.syncButton}
      modalText={TEXTS.syncButtonDescription}
    >
      {TEXTS.syncButton}
    </ButtonWithModal>
  );
}
