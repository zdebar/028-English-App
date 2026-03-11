import { useAuthStore } from '@/features/auth/use-auth-store';
import { useToastStore } from '@/features/toast/use-toast-store';
import { TEXTS } from '@/locales/cs';
import { type JSX } from 'react';
import { errorHandler } from '../logging/error-handler';
import { audioSync } from '@/database/utils/data-sync.utils';
import { logRejectedResults } from '../logging/logging.utils';
import { MenuButton } from '@/components/UI/buttons/MenuButton';
import config from '@/config/config';
import { useMinLoading } from '../modal/use-min-loading';
import { db } from '@/database/models/db';

/**
 * DownloadButton component for downloading the current user's data.
 *
 * @param className - Optional CSS class name to apply to the button.
 * @returns The rendered DownloadButton component.
 */
export default function DownloadButton({ className }: { className?: string }): JSX.Element {
  const userId = useAuthStore((state) => state.userId);
  const showToast = useToastStore((state) => state.showToast);
  const hideToast = useToastStore((state) => state.hideToast);
  const { isLoading, setIsLoading } = useMinLoading(config.buttons.minLoadingTime);

  const handleSync = async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      showToast(TEXTS.syncLoadingText, 'info', true);
      db.audio_metadata.clear();
      const userResults = await Promise.allSettled([audioSync(userId, true)]);
      const isError = logRejectedResults(userResults, 'Data download error:');
      if (isError) throw new Error('Data download error');
      hideToast();
      showToast(TEXTS.downloadSuccessToast, 'success');
    } catch (error) {
      hideToast();
      showToast(TEXTS.downloadErrorToast, 'error');
      errorHandler('Download Error', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MenuButton
      onClick={handleSync}
      className={className}
      disabled={!userId || isLoading}
      title={TEXTS.downloadButtonTooltip}
    >
      {TEXTS.downloadButton}
    </MenuButton>
  );
}
