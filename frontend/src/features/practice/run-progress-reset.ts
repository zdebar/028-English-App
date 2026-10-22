import { invalidateReviewArrays } from './review-prefetch';
import { refreshPracticeAvailability } from './practice-availability-controller';
import { reportError, reportInfo } from '@/features/logging/monitoring-handler';
import { useToastStore } from '@/features/toast/use-toast-store';
import { TEXTS } from '@/locales/cs';

type ProgressResetOptions<TResult> = Readonly<{
  successLog: (result: TResult) => string;
  errorContext: string;
}>;

/** Applies common cache, availability, logging, and feedback behavior around a progress reset. */
export async function runProgressReset<TResult>(
  userId: string | null,
  reset: () => Promise<TResult>,
  { successLog, errorContext }: ProgressResetOptions<TResult>,
): Promise<void> {
  if (!userId) return;

  try {
    const result = await reset();
    invalidateReviewArrays(userId);
    void refreshPracticeAvailability(userId);
    reportInfo(successLog(result));
    useToastStore.getState().showToast(TEXTS.resetProgressSuccessToast, 'success');
  } catch (error) {
    useToastStore.getState().showToast(TEXTS.resetProgressErrorToast, 'error');
    reportError(errorContext, error);
  }
}
