interface ImportMetaEnv {
  readonly VITE_APP_VERSION?: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  readonly VITE_TURNSTILE_SITE_KEY?: string;
  readonly VITE_TURNSTILE_SIZE?: 'normal' | 'compact' | 'flexible';
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_SENTRY_ENABLED?: 'true' | 'false';
  readonly VITE_SENTRY_TRACES_SAMPLE_RATE?: string;
  readonly VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE?: string;
  readonly VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE?: string;
  readonly VITE_VERBOSE_INFO_LOGS?: 'true' | 'false';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
