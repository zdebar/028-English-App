import * as Sentry from '@sentry/react';

type MonitoringContext = Record<string, string | number | boolean | null | undefined>;

function isLocalhostRuntime(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

function isSentryEnabled(): boolean {
  const allowLocal = import.meta.env.VITE_SENTRY_ALLOW_LOCAL === 'true';

  return (
    import.meta.env.PROD &&
    Boolean(import.meta.env.VITE_SENTRY_DSN) &&
    import.meta.env.VITE_SENTRY_ENABLED !== 'false' &&
    (allowLocal || !isLocalhostRuntime())
  );
}

function parseSampleRate(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(0, Math.min(1, parsed));
}

export function initializeMonitoring(): void {
  if (!isSentryEnabled()) {
    return;
  }

  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION,
    tracesSampleRate: parseSampleRate(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE, 0.1),
    replaysSessionSampleRate: parseSampleRate(
      import.meta.env.VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE,
      0,
    ),
    replaysOnErrorSampleRate: parseSampleRate(
      import.meta.env.VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE,
      1,
    ),
    integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
    sendDefaultPii: false,
  });
}

function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  return new Error(typeof error === 'string' ? error : JSON.stringify(error));
}

export function setMonitoringUser(userId?: string | null): void {
  if (!isSentryEnabled()) {
    return;
  }

  if (!userId) {
    Sentry.setUser(null);
    return;
  }

  Sentry.setUser({ id: userId });
}

export function reportError(message: string, error: unknown, context?: MonitoringContext): void {
  if (import.meta.env.DEV) {
    console.error(message, error, context);
  }

  if (!isSentryEnabled()) {
    return;
  }

  const normalizedError = normalizeError(error);
  Sentry.captureException(normalizedError, {
    tags: { source: message },
    contexts: context ? { app_context: context } : undefined,
  });
}

export function reportInfo(message: string, context?: MonitoringContext): void {
  let safeContext: MonitoringContext | undefined = undefined;
  if (context) {
    const { userId, ...rest } = context;
    safeContext = rest;
  }
  if (safeContext && Object.keys(safeContext).length > 0) {
    console.info(message, safeContext);
  } else {
    console.info(message);
  }
}
