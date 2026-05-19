import { reportError } from './monitoring-handler';

export type SyncSummary = {
  total: number;
  success: number;
  failed: number;
  sampleErrors?: unknown[];
};

/**
 * Compute summary for an array of promises using Promise.allSettled.
 *
 * @param promises - Array of promises to summarize
 * @param context - Optional context string for error reporting
 * @param sampleLimit - Maximum number of rejected reasons to include in the summary
 * @param throwOnRejected - Whether to throw an AggregateError if any promise is rejected
 * @returns A summary object containing total, success, failed counts and optional sample errors
 */
export async function withSettledSummary(
  promises: Promise<unknown>[],
  context: string = '',
  sampleLimit: number = 3,
  throwOnRejected: boolean = false,
): Promise<SyncSummary> {
  const results = await Promise.allSettled(promises);
  const rejected = results.filter((r) => r.status === 'rejected') as PromiseRejectedResult[];
  const sampleErrors = rejected.slice(0, sampleLimit).map((r) => r.reason);

  const summary: SyncSummary = {
    total: results.length,
    success: results.length - rejected.length,
    failed: rejected.length,
    ...(sampleErrors.length > 0 && { sampleErrors }),
  };

  if (summary.failed > 0) {
    for (const error of sampleErrors) {
      try {
        reportError(context, error);
      } catch {
        // swallow logging errors to avoid masking primary operation
      }
    }
  }

  if (throwOnRejected && rejected.length > 0) {
    throw new AggregateError(
      rejected.map((r) => r.reason),
      context,
    );
  }

  return summary;
}
