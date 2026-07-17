import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  isOpen: true,
  dismiss: vi.fn(),
  showToast: vi.fn(),
  reportError: vi.fn(),
  getSession: vi.fn(),
  signInWithOAuth: vi.fn(),
  saveFallback: vi.fn(),
  clearFallback: vi.fn(),
}));

vi.mock('@/config/supabase.config', () => ({
  supabaseInstance: {
    auth: {
      getSession: (...args: unknown[]) => mocks.getSession(...args),
      signInWithOAuth: (...args: unknown[]) => mocks.signInWithOAuth(...args),
    },
  },
}));

vi.mock('@/features/auth/anonymous-session-fallback', () => ({
  saveAnonymousSessionFallback: (...args: unknown[]) => mocks.saveFallback(...args),
  clearAnonymousSessionFallback: (...args: unknown[]) => mocks.clearFallback(...args),
}));

vi.mock('@/features/auth/use-auth-store', () => ({
  useAuthStore: (selector: (state: any) => unknown) =>
    selector({
      hasIdentityLinkConflict: mocks.isOpen,
      dismissIdentityLinkConflict: mocks.dismiss,
    }),
}));

vi.mock('@/features/toast/use-toast-store', () => ({
  useToastStore: (selector: (state: any) => unknown) =>
    selector({ showToast: mocks.showToast }),
}));

vi.mock('@/features/logging/monitoring-handler', () => ({
  reportError: (...args: unknown[]) => mocks.reportError(...args),
}));

vi.mock('@/features/modal/Modal', () => ({
  Modal: ({
    children,
    onClose,
    onConfirm,
    cancelLabel,
    confirmLabel,
    actionsLayout,
  }: any) => (
    <div data-testid="modal" data-layout={actionsLayout}>
      {children}
      <button type="button" onClick={onClose}>
        {cancelLabel}
      </button>
      <button type="button" onClick={onConfirm}>
        {confirmLabel}
      </button>
    </div>
  ),
}));

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    identityLinkConflictTitle: 'Google account exists',
    identityLinkConflictText: 'Guest progress will not transfer.',
    continueAsGuest: 'Continue as guest',
    signInExistingAccount: 'Sign into existing account',
    existingAccountSigninErrorToast: 'Guest restored',
    authInitErrorToast: 'Authentication failed',
  },
}));

import IdentityLinkConflictModal from '@/features/auth/IdentityLinkConflictModal';

describe('IdentityLinkConflictModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isOpen = true;
    mocks.getSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'access',
          refresh_token: 'refresh',
          user: { id: 'guest-1', is_anonymous: true },
        },
      },
      error: null,
    });
  });

  it('renders the explanation and vertically arranged choices', () => {
    render(<IdentityLinkConflictModal />);

    expect(screen.getByText('Google account exists')).toBeTruthy();
    expect(screen.getByText('Guest progress will not transfer.')).toBeTruthy();
    expect(screen.getByTestId('modal').dataset.layout).toBe('vertical');
  });

  it('continues as guest without starting authentication', () => {
    render(<IdentityLinkConflictModal />);

    fireEvent.click(screen.getByRole('button', { name: 'Continue as guest' }));

    expect(mocks.dismiss).toHaveBeenCalledTimes(1);
    expect(mocks.signInWithOAuth).not.toHaveBeenCalled();
  });

  it('backs up the guest and starts normal Google sign-in', async () => {
    const oauthError = { code: 'provider_disabled', message: 'Unavailable' };
    mocks.signInWithOAuth.mockResolvedValue({ data: { url: null }, error: oauthError });

    render(<IdentityLinkConflictModal />);
    fireEvent.click(screen.getByRole('button', { name: 'Sign into existing account' }));

    await waitFor(() => {
      expect(mocks.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: expect.any(String),
          queryParams: { prompt: 'select_account' },
          skipBrowserRedirect: true,
        },
      });
    });

    expect(mocks.saveFallback).toHaveBeenCalledTimes(1);
    expect(mocks.clearFallback).toHaveBeenCalledTimes(1);
    expect(mocks.reportError).toHaveBeenCalledWith(
      'Existing Google account sign-in failed',
      oauthError,
    );
    expect(mocks.showToast).toHaveBeenCalledWith('Guest restored', 'error');
  });

  it('does not render when no collision is active', () => {
    mocks.isOpen = false;

    const { container } = render(<IdentityLinkConflictModal />);

    expect(container.firstChild).toBeNull();
  });
});
