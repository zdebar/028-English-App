import { useEffect } from 'react';
import { reportError } from './monitoring-handler';
import { useToastStore } from '@/features/toast/use-toast-store';
import { TEXTS } from '@/locales/cs';

/** Shows the shared loading error and records the feature-specific context. */
export function useQueryErrorToast(error: Error | null, context: string): void {
  const showToast = useToastStore((state) => state.showToast);

  useEffect(() => {
    if (!error) return;
    showToast(TEXTS.loadingError, 'error');
    reportError(context, error);
  }, [context, error, showToast]);
}
