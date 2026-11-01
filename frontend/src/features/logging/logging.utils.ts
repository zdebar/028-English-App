import { reportError } from './logging-handler';

export type SyncSummary = {
  total: number;
  success: number;
  failed: number;
  sampleErrors?: unknown[];
};

/** Summarizes settled results and reports a limited sample of failures. */
export function summarizeSettledResults(
  results: PromiseSettledResult<unknown>[],
  context: string = '',
  sampleLimit: number = 3,
  throwOnRejected: boolean = false,
): SyncSummary {
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

/** Computes a settled summary for promises using Promise.allSettled. */
export async function withSettledSummary(
  promises: Promise<unknown>[],
  context: string = '',
  sampleLimit: number = 3,
  throwOnRejected: boolean = false,
): Promise<SyncSummary> {
  const results = await Promise.allSettled(promises);
  return summarizeSettledResults(results, context, sampleLimit, throwOnRejected);
}
