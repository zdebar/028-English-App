import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  linkIdentity: vi.fn(),
  saveFallback: vi.fn(),
  clearFallback: vi.fn(),
  reportError: vi.fn(),
  showToast: vi.fn(),
}));

vi.mock('@/config/supabase.config', () => ({
  supabaseInstance: {
    auth: {
      getSession: (...args: unknown[]) => mocks.getSession(...args),
      linkIdentity: (...args: unknown[]) => mocks.linkIdentity(...args),
    },
  },
}));

vi.mock('@/features/auth/anonymous-session-fallback', () => ({
  saveAnonymousSessionFallback: (...args: unknown[]) => mocks.saveFallback(...args),
  clearAnonymousSessionFallback: (...args: unknown[]) => mocks.clearFallback(...args),
}));

vi.mock('@/features/logging/monitoring-handler', () => ({
  reportError: (...args: unknown[]) => mocks.reportError(...args),
}));

vi.mock('@/features/toast/use-toast-store', () => ({
  useToastStore: (selector: (state: { showToast: typeof mocks.showToast }) => unknown) =>
    selector({ showToast: mocks.showToast }),
}));

vi.mock('@/features/auth/SigninButton', () => ({
  default: ({ onClick, disabled, label }: any) => (
    <button type="button" onClick={onClick} disabled={disabled}>
      {label}
    </button>
  ),
}));

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    convertAnonymousButton: 'Convert guest',
    convertAnonymousButtonTooltip: 'Convert',
    convertAnonymousLoading: 'Converting',
    convertAnonymousErrorToast: 'Conversion failed',
  },
}));

import ConvertAnonymousUserButton from '@/features/auth/ConvertAnonymousUserButton';

describe('ConvertAnonymousUserButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'guest-access',
          refresh_token: 'guest-refresh',
          user: { id: 'guest-1', is_anonymous: true },
        },
      },
      error: null,
    });
  });

  it('backs up the guest with linking intent before starting Google identity linking', async () => {
    const linkError = { code: 'provider_disabled', message: 'Unavailable' };
    mocks.linkIdentity.mockResolvedValue({ data: { url: null }, error: linkError });

    render(<ConvertAnonymousUserButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Convert guest' }));

    await waitFor(() => {
      expect(mocks.linkIdentity).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: expect.any(String),
          skipBrowserRedirect: true,
        },
      });
    });

    expect(mocks.saveFallback).toHaveBeenCalledWith(
      expect.objectContaining({ user: expect.objectContaining({ id: 'guest-1' }) }),
      'link-google-identity',
    );
    expect(mocks.clearFallback).toHaveBeenCalledTimes(1);
    expect(mocks.reportError).toHaveBeenCalledWith('Anonymous conversion failed', linkError);
    expect(mocks.showToast).toHaveBeenCalledWith('Conversion failed', 'error');
  });

  it('does not start linking when the current session is not anonymous', async () => {
    mocks.getSession.mockResolvedValue({
      data: { session: { user: { id: 'permanent-1', is_anonymous: false } } },
      error: null,
    });

    render(<ConvertAnonymousUserButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Convert guest' }));

    await waitFor(() => {
      expect(mocks.showToast).toHaveBeenCalledWith('Conversion failed', 'error');
    });

    expect(mocks.saveFallback).not.toHaveBeenCalled();
    expect(mocks.linkIdentity).not.toHaveBeenCalled();
    expect(mocks.clearFallback).toHaveBeenCalledTimes(1);
  });
});
