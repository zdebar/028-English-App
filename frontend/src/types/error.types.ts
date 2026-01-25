export class AuthenticationError extends Error {
  originalError: Error;

  constructor(message: string, originalError: Error) {
    super(message);
    this.name = 'AuthenticationError';
    this.originalError = originalError;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AuthenticationError);
    }
  }
}
