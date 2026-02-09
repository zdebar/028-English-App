export class DatabaseError extends Error {
  args: Record<string, unknown>;
  constructor(
    message: string,
    original?: Error,
    args: Record<string, unknown> = {},
    options?: ErrorOptions,
  ) {
    super(original ? `${message}: ${original.message}` : message, { cause: original, ...options });
    this.name = 'DatabaseError';
    this.args = args;
  }
}
