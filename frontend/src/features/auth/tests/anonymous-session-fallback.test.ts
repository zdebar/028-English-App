import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  setSession: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('@/config/supabase.config', () => ({
  supabaseInstance: {
    auth: {
      setSession: (...args: unknown[]) => mocks.setSession(...args),
      signOut: (...args: unknown[]) => mocks.signOut(...args),
    },
  },
}));

import {
  clearAuthErrorParameters,
  getAnonymousSessionFallbackIntent,
  hasAnonymousSessionFallback,
  restoreAnonymousSessionFallback,
  saveAnonymousSessionFallback,
} from '@/features/auth/anonymous-session-fallback';

const anonymousSession = {
  access_token: 'access-token',
  refresh_token: 'refresh-token',
  user: { id: 'guest-1', is_anonymous: true },
};

describe('anonymous session fallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    sessionStorage.clear();
    history.replaceState(null, '', '/');
    mocks.signOut.mockResolvedValue({ error: null });
  });

  it('stores and restores the same anonymous session', async () => {
    saveAnonymousSessionFallback(anonymousSession as any, 'link-google-identity');
    expect(getAnonymousSessionFallbackIntent()).toBe('link-google-identity');
    mocks.setSession.mockResolvedValue({
      data: { session: anonymousSession },
      error: null,
    });

    await expect(
      restoreAnonymousSessionFallback('link-google-identity'),
    ).resolves.toEqual(anonymousSession);

    expect(mocks.setSession).toHaveBeenCalledWith({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
    });
    expect(hasAnonymousSessionFallback()).toBe(false);
  });

  it('rejects and clears a restored session belonging to another user', async () => {
    saveAnonymousSessionFallback(anonymousSession as any, 'sign-in-existing-google-account');
    mocks.setSession.mockResolvedValue({
      data: {
        session: {
          ...anonymousSession,
          user: { id: 'different-user', is_anonymous: false },
        },
      },
      error: null,
    });

    await expect(
      restoreAnonymousSessionFallback('sign-in-existing-google-account'),
    ).rejects.toThrow('Restored session does not match');

    expect(mocks.signOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(hasAnonymousSessionFallback()).toBe(false);
  });

  it('rejects malformed and expired fallback data', () => {
    sessionStorage.setItem('google-signin-anonymous-session-fallback', 'not-json');
    expect(hasAnonymousSessionFallback()).toBe(false);

    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);
    saveAnonymousSessionFallback(anonymousSession as any, 'link-google-identity');
    vi.spyOn(Date, 'now').mockReturnValue(now + 16 * 60 * 1000);

    expect(hasAnonymousSessionFallback()).toBe(false);
  });

  it('rejects and clears a fallback with the wrong intent', async () => {
    saveAnonymousSessionFallback(anonymousSession as any, 'link-google-identity');

    await expect(
      restoreAnonymousSessionFallback('sign-in-existing-google-account'),
    ).rejects.toThrow('No valid anonymous session fallback');

    expect(hasAnonymousSessionFallback()).toBe(false);
    expect(mocks.setSession).not.toHaveBeenCalled();
  });

  it('removes only authentication error parameters from the URL', () => {
    history.replaceState(
      { retained: true },
      '',
      '/callback?keep=yes&error=access_denied&error_code=oauth_error&error_description=nope#part',
    );

    clearAuthErrorParameters();

    expect(location.pathname).toBe('/callback');
    expect(location.search).toBe('?keep=yes');
    expect(location.hash).toBe('#part');
    expect(history.state).toEqual({ retained: true });
  });
});
