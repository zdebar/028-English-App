/** Converts a thrown value into an Error while preserving existing Error instances. */
export function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}
