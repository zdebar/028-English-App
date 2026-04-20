/**
 * Handles errors by logging them locally.
 *
 * @param error - The error object or unknown value to handle.
 * @param message - Contextual message to prepend to the error log.
 */
export function errorHandler(message: string, error: unknown): void {
  // 1. Log error locally
  if (process.env.NODE_ENV === 'development') {
    console.error(message, error);
  }
  // 3. Optionally block app
  // (future implementation: potentially set a global state to disable UI interactions)
}
