interface ImportMetaEnv {
  readonly VITE_CAPTCHA_SITE_KEY?: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  readonly VITE_VERBOSE_INFO_LOGS?: 'true' | 'false';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
