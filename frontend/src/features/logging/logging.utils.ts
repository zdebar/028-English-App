import { errorHandler } from './error-handler';

/**
 * Logs all rejected promise results with a given context.
 * @param results - An array of settled promise results to check for rejections
 * @param context - A string describing the context in which the rejections occurred
 */
export function logRejectedResults(
  results: PromiseSettledResult<unknown>[],
  context: string,
): void {
  results.forEach((result) => {
    if (result.status === 'rejected') {
      errorHandler(context, result.reason);
    }
  });
}
