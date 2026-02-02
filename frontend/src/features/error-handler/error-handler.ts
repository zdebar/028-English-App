export function errorHandler(error: Error) {
  // 1. Log error locally
  console.error(error);

  // 2. Send error to remote service
  // (future implementation: e.g., Sentry, LogRocket, etc.)

  // 3. Optionally block app
  // (future implementation: potentially set a global state to disable UI interactions)
}
