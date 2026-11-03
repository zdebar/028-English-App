type LoggingContext = Record<string, string | number | boolean | null | undefined>;

function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === 'string') {
    return new Error(error);
  }

  try {
    const serializedError = JSON.stringify(error);
    if (serializedError !== undefined) {
      return new Error(serializedError);
    }
  } catch {
    // Fall back to a string representation for circular or otherwise unserializable values.
  }

  try {
    return new Error(String(error));
  } catch {
    return new Error('Unknown error');
  }
}

export function reportError(message: string, error: unknown, context?: LoggingContext): void {
  console.error(message, normalizeError(error), context);
}

export function reportInfo(message: string, context?: LoggingContext): void {
  if (!import.meta.env.DEV && import.meta.env.VITE_VERBOSE_INFO_LOGS !== 'true') {
    return;
  }

  const safeContext = context
    ? Object.fromEntries(Object.entries(context).filter(([key]) => key !== 'userId'))
    : undefined;

  if (safeContext && Object.keys(safeContext).length > 0) {
    console.info(message, safeContext);
    return;
  }

  console.info(message);
}
