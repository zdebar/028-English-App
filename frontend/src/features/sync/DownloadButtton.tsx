import { useAuthStore } from '@/features/auth/use-auth-store';
import { useToastStore } from '@/features/toast/use-toast-store';
import { TEXTS } from '@/locales/cs';
import { type JSX } from 'react';
import { errorHandler } from '../logging/error-handler';
import { audioSync } from '@/database/utils/data-sync.utils';
import { logRejectedResults } from '../logging/logging.utils';
import { MenuButton } from '@/components/UI/buttons/MenuButton';

/**
 * DownloadButton component for downloading the current user's data.
 *
 * @param className - Optional CSS class name to apply to the button.
 * @returns The rendered DownloadButton component.
 */
export default function DownloadButton({ className }: { className?: string }): JSX.Element {
  const userId = useAuthStore((state) => state.userId);
  const showToast = useToastStore((state) => state.showToast);

  const handleSync = async () => {
    if (!userId) return;

    try {
      const userResults = await Promise.allSettled([audioSync(userId, true)]);
      const isError = logRejectedResults(userResults, 'Data download error:');
      if (isError) throw new Error('Data download error');

      showToast(TEXTS.downloadSuccessToast, 'success');
    } catch (error) {
      showToast(TEXTS.downloadErrorToast, 'error');
      errorHandler('Download Error', error);
    }
  };

  return (
    <MenuButton
      onClick={handleSync}
      className={className}
      disabled={!userId}
      title={TEXTS.downloadButtonTooltip}
    >
      {TEXTS.downloadButton}
    </MenuButton>
  );
}
