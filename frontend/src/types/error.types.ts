export class DatabaseError extends Error {
  args: Record<string, unknown>;
  constructor(
    message: string,
    original: Error,
    args: Record<string, unknown> = {},
    options?: ErrorOptions,
  ) {
    super(`${message}: ${original.message}`, { cause: original, ...options });
    this.name = 'DatabaseError';
    this.args = args;
  }
}
