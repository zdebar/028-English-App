import { reportError } from './logging-handler';

export type SyncSummary = {
  total: number;
  success: number;
  failed: number;
  sampleErrors?: unknown[];
  errors?: unknown[];
};

/** Summarizes settled results and reports a limited sample of failures. */
export function summarizeSettledResults(
  results: PromiseSettledResult<unknown>[],
  context: string = '',
  sampleLimit: number = 3,
  throwOnRejected: boolean = false,
  reportFailures = true,
): SyncSummary {
  const rejected = getRejectedResults(results);
  const summary = createSyncSummary(results.length, rejected, sampleLimit);
  if (reportFailures) reportSyncFailures(context, summary.sampleErrors ?? []);
  if (throwOnRejected && rejected.length > 0) throw new AggregateError(rejected.map((result) => result.reason), context);

  return summary;
}

function getRejectedResults(results: readonly PromiseSettledResult<unknown>[]): PromiseRejectedResult[] {
  return results.filter((result): result is PromiseRejectedResult => result.status === 'rejected');
}

function createSyncSummary(
  total: number,
  rejected: readonly PromiseRejectedResult[],
  sampleLimit: number,
): SyncSummary {
  const sampleErrors = rejected.slice(0, sampleLimit).map((result) => result.reason);
  return {
    total,
    success: total - rejected.length,
    failed: rejected.length,
    ...(sampleErrors.length > 0 && { sampleErrors }),
    ...(rejected.length > 0 && { errors: rejected.map((result) => result.reason) }),
  };
}

function reportSyncFailures(context: string, errors: readonly unknown[]): void {
  for (const error of errors) {
    try {
      reportError(context, error);
    } catch {
      // Swallow logging errors to avoid masking primary operation.
    }
  }
}

/** Computes a settled summary for promises using Promise.allSettled. */
export async function withSettledSummary(
  promises: Promise<unknown>[],
  context: string = '',
  sampleLimit: number = 3,
  throwOnRejected: boolean = false,
  reportFailures = true,
): Promise<SyncSummary> {
  const results = await Promise.allSettled(promises);
  return summarizeSettledResults(results, context, sampleLimit, throwOnRejected, reportFailures);
}
