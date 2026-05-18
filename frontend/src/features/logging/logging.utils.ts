import { reportError } from './monitoring-handler';

export function logRejectedResults(
  results: PromiseSettledResult<unknown>[],
  context: string,
): boolean {
  let hasError = false;

  for (const result of results) {
    if (result.status === 'rejected') {
      reportError(context, result.reason);
      hasError = true;
    }
  }

  return hasError;
}
