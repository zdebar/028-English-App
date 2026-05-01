import { useAuthStore } from '@/features/auth/use-auth-store';
import { TEXTS } from '@/locales/cs';
import { type JSX } from 'react';
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

  const handleSync = async () => {
    if (!userId) return;
    const userResults = await Promise.allSettled([dataSync(userId, true), audioSync(userId)]);
    const isError = logRejectedResults(userResults, 'Data synchronization error:');
    if (isError) throw new Error('Data synchronization error');
  };

  return (
    <ModalButton
      onConfirm={handleSync}
      className={className}
      successToastText={TEXTS.syncSuccessToast}
      errorToastText={TEXTS.syncErrorToast}
      disabled={!userId}
      title={TEXTS.dataSyncTooltip}
      modalTitle={TEXTS.syncButton}
      modalText={TEXTS.syncButtonDescription}
    >
      {TEXTS.syncButton}
    </ModalButton>
  );
}
