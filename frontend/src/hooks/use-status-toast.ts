import { useEffect } from 'react';
import { useToastStore } from '@/features/toast/use-toast-store';
import type { HookStatus } from '@/types/generic.types';
import { errorHandler } from '@/features/logging/error-handler';
import { TEXTS } from '@/locales/cs';

type UseStatusToastProps = Readonly<{
  status: HookStatus;
  type: 'fetch' | 'reset';
  showSuccessToast?: boolean;
  successMessage?: string;
  errorMessage?: string | null;
  error?: unknown;
}>;

const DEFAULT_MESSAGES = {
  fetch: {
    success: TEXTS.loadingSuccess,
    error: TEXTS.loadingError,
  },
  reset: {
    success: TEXTS.resetProgressSuccessToast,
    error: TEXTS.resetProgressErrorToast,
  },
} as const;

/**
 * Shows toast notifications when operation status transitions to success or error.
 * Useful for hooks/components that expose status + error and keep UI side effects outside.
 */
export function useStatusToast({
  status,
  successMessage,
  showSuccessToast = false,
  errorMessage,
  error = null,
  type,
}: UseStatusToastProps): void {
  const showToast = useToastStore((state) => state.showToast);

  useEffect(() => {
    const defaults = DEFAULT_MESSAGES[type];

    if (status === 'success' && showSuccessToast) {
      showToast(successMessage ?? defaults.success, 'success');
    }

    if (status === 'error') {
      const message = errorMessage ?? defaults.error;
      showToast(message, 'error');
      errorHandler(message, error);
    }
  }, [status]);
}
