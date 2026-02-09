/**
 * Handles informational messages by logging them locally.
 *
 * @param message - Contextual message to log.
 * @param info - The informational object or unknown value to handle.
 */
export function infoHandler(message: string): void {
  // 1. Log info locally
  if (process.env.NODE_ENV === 'development') {
    console.info(message);
  }
}
