import { useAuthStore } from '@/features/auth/use-auth-store';
import { useToastStore } from '@/features/toast/use-toast-store';
import { TEXTS } from '@/locales/cs';
import { type JSX } from 'react';
import { MenuButton } from '@/components/UI/buttons/MenuButton';
import { errorHandler } from '../logging/error-handler';
import { audioSync, dataSync } from '@/database/utils/data-sync.utils';
import { logRejectedResults } from '../logging/logging.utils';

/**
 * SyncButton component for synchronizing the current user's data.
 *
 * @param className - Optional CSS class name to apply to the button.
 * @returns The rendered SyncButton component.
 */
export default function SyncButton({ className }: { className?: string }): JSX.Element {
  const userId = useAuthStore((state) => state.userId);
  const showToast = useToastStore((state) => state.showToast);

  const handleSync = async () => {
    if (!userId) return;

    try {
      const userResults = await Promise.allSettled([dataSync(userId, true), audioSync(userId)]);
      const isError = logRejectedResults(userResults, 'Data synchronization error:');
      if (isError) throw new Error('Data synchronization error');

      showToast(TEXTS.syncSuccessToast, 'success');
    } catch (error) {
      showToast(TEXTS.syncErrorToast, 'error');
      errorHandler('Sync Error', error);
    }
  };

  return (
    <MenuButton onClick={handleSync} className={className} disabled={!userId}>
      {TEXTS.syncButton}
    </MenuButton>
  );
}
