/**
 * Handles errors by logging them locally.
 *
 * @param error - The error object or unknown value to handle.
 * @param message - Optional contextual message to prepend to the error log.
 */
export function errorHandler(error: Error | unknown, message?: string): void {
  let errorMsg: string;
  if (error instanceof Error) {
    errorMsg = error.stack || error.message;
  } else {
    errorMsg = String(error);
  }

  // 1. Log error locally
  console.error(message ? `${message}: ${errorMsg}` : errorMsg);

  // 2. Send error to remote service
  // (future implementation: e.g., Sentry, LogRocket, etc.)

  // 3. Optionally block app
  // (future implementation: potentially set a global state to disable UI interactions)
}
