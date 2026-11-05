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

export class SupabaseError extends Error {
  args: Record<string, unknown>;
  constructor(
    message: string,
    original?: Error,
    args: Record<string, unknown> = {},
    options?: ErrorOptions,
  ) {
    super(original ? `${message}: ${original.message}` : message, { cause: original, ...options });
    this.name = 'SupabaseError';
    this.args = args;
  }
}

/** Represents an optional audio object that is absent from remote storage. */
export class AudioFileNotFoundError extends Error {
  constructor(filename: string, options?: ErrorOptions) {
    super(`Audio file is not available: ${filename}`, options);
    this.name = 'AudioFileNotFoundError';
  }
}

export class ZipExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ZipExtractionError';
  }
}
