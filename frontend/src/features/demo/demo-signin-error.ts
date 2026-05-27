import { TEXTS } from '@/locales/cs';

export function getDemoSigninErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  if (raw.startsWith('DEMO_AUTH_FAILED:')) {
    const detail = raw.slice('DEMO_AUTH_FAILED:'.length).trim();
    if (import.meta.env.DEV && detail) {
      return `${TEXTS.demoSigninError} (${detail})`;
    }
    return TEXTS.demoSigninError;
  }
  if (raw === 'DEMO_INVALID_CREDENTIALS') {
    return TEXTS.demoSigninInvalidCredentialsError;
  }
  if (raw === 'DEMO_EMAIL_PROVIDER_DISABLED') {
    return TEXTS.demoSigninEmailProviderDisabledError;
  }
  if (raw === 'DEMO_AUTH_FAILED') {
    return TEXTS.demoSigninError;
  }
  if (raw === 'RATE_LIMIT') {
    return TEXTS.demoSigninRateLimitError;
  }
  if (raw === 'CAPTCHA_FAILED') {
    return TEXTS.demoSigninCaptchaError;
  }

  const normalized = raw.toLowerCase();
  if (normalized.includes('429')) {
    return TEXTS.demoSigninRateLimitError;
  }
  if (normalized.includes('captcha')) {
    return TEXTS.demoSigninCaptchaError;
  }

  return TEXTS.demoSigninError;
}
