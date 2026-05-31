import { describe, expect, it, vi } from 'vitest';

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    demoSigninError: 'Demo signin error',
    demoSigninInvalidCredentialsError: 'Invalid credentials',
    demoSigninEmailProviderDisabledError: 'Email provider disabled',
    demoSigninCaptchaStillEnabledError: 'Captcha enabled',
    demoSigninRateLimitError: 'Rate limited',
  },
}));

import { getDemoSigninErrorMessage } from '@/features/demo/demo-signin-error';

describe('getDemoSigninErrorMessage', () => {
  it('maps known code errors', () => {
    expect(getDemoSigninErrorMessage(new Error('DEMO_INVALID_CREDENTIALS'))).toBe(
      'Invalid credentials',
    );
    expect(getDemoSigninErrorMessage(new Error('DEMO_EMAIL_PROVIDER_DISABLED'))).toBe(
      'Email provider disabled',
    );
    expect(getDemoSigninErrorMessage(new Error('DEMO_AUTH_CAPTCHA_ENABLED'))).toBe('Captcha enabled');
    expect(getDemoSigninErrorMessage(new Error('RATE_LIMIT'))).toBe('Rate limited');
  });

  it('maps generic auth failures and 429 text fallback', () => {
    expect(getDemoSigninErrorMessage(new Error('DEMO_AUTH_FAILED'))).toBe('Demo signin error');
    expect(getDemoSigninErrorMessage(new Error('HTTP 429: too many requests'))).toBe('Rate limited');
  });

  it('keeps generic message for unknown errors', () => {
    expect(getDemoSigninErrorMessage(new Error('unexpected failure'))).toBe('Demo signin error');
  });
});