/**
 * Handles errors by logging them locally.
 *
 * @param error - The error object or unknown value to handle.
 * @param message - Optional contextual message to prepend to the error log.
 */
export function errorHandler(error: Error | unknown, message?: string): void {
  // 1. Log error locally
  if (process.env.NODE_ENV === 'development') {
    console.error(message, error);
  } else {
    // 2. Send error to remote service
    // (future implementation: e.g., Sentry, LogRocket, etc.)
  }
  // 3. Optionally block app
  // (future implementation: potentially set a global state to disable UI interactions)
}
