import { errorHandler } from './error-handler';

/**
 * Logs all rejected promise results with a given context.
 * @param results - An array of settled promise results to check for rejections
 * @param context - A string describing the context in which the rejections occurred
 * @return true if any of the results were rejected, false otherwise
 */
export function logRejectedResults(
  results: PromiseSettledResult<unknown>[],
  context: string,
): boolean {
  let hasError = false;
  results.forEach((result) => {
    if (result.status === 'rejected') {
      errorHandler(context, result.reason);
      hasError = true;
    }
  });
  return hasError;
}
