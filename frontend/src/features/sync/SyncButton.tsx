import { useAuthStore } from '@/features/auth/use-auth-store';
import { useToastStore } from '@/features/toast/use-toast-store';
import { TEXTS } from '@/locales/cs';
import { type JSX } from 'react';
import { errorHandler } from '../logging/error-handler';
import { audioSync, dataSync } from '@/database/utils/data-sync.utils';
import { logRejectedResults } from '../logging/logging.utils';
import ModalButton from '../modal/ModalButton';

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
  const hideToast = useToastStore((state) => state.hideToast);

  const handleSync = async () => {
    if (!userId) return;

    try {
      showToast(TEXTS.syncLoadingText, 'info', true);
      const userResults = await Promise.allSettled([dataSync(userId, true), audioSync(userId)]);
      const isError = logRejectedResults(userResults, 'Data synchronization error:');
      if (isError) throw new Error('Data synchronization error');
      hideToast();
      showToast(TEXTS.syncSuccessToast, 'success');
    } catch (error) {
      hideToast();
      showToast(TEXTS.syncErrorToast, 'error');
      errorHandler('Sync Error', error);
    }
  };

  return (
    <ModalButton
      onConfirm={handleSync}
      className={className}
      disabled={!userId}
      title={TEXTS.dataSyncTooltip}
      modalTitle={TEXTS.syncButton}
      modalText={TEXTS.syncButtonDescription}
    >
      <p className="mx-auto w-40">{TEXTS.syncButton}</p>
    </ModalButton>
  );
}
