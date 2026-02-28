import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  userId: 'u1' as string | null,
  handleLogout: vi.fn(),
  showToast: vi.fn(),
  errorHandler: vi.fn(),
}));

vi.mock('@/features/auth/use-auth-store', () => ({
  useAuthStore: (
    selector: (state: {
      userId: string | null;
      handleLogout: typeof mocks.handleLogout;
    }) => unknown,
  ) => selector({ userId: mocks.userId, handleLogout: mocks.handleLogout }),
}));

vi.mock('@/features/toast/use-toast-store', () => ({
  useToastStore: (selector: (state: { showToast: typeof mocks.showToast }) => unknown) =>
    selector({ showToast: mocks.showToast }),
}));

vi.mock('@/features/logging/error-handler', () => ({
  errorHandler: (...args: unknown[]) => mocks.errorHandler(...args),
}));

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    signoutButtonTitle: 'Sign out',
    signoutModalText: 'Confirm sign out',
    signoutSuccess: 'Signout success',
    signoutError: 'Signout error',
  },
}));

vi.mock('@/features/modal/ButtonWithModal', () => ({
  default: ({ disabled, onConfirm, children }: any) => (
    <button data-testid="button-with-modal" disabled={disabled} onClick={() => void onConfirm?.()}>
      {children}
    </button>
  ),
}));

import SignoutButton from '@/features/auth/SignoutButton';

describe('SignoutButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.userId = 'u1';
    mocks.handleLogout.mockResolvedValue(undefined);
  });

  it('is disabled when user is not available', () => {
    mocks.userId = null;

    render(<SignoutButton />);

    expect(screen.getByTestId('button-with-modal').hasAttribute('disabled')).toBe(true);
  });

  it('calls logout and shows success toast', async () => {
    render(<SignoutButton />);
    fireEvent.click(screen.getByTestId('button-with-modal'));

    await waitFor(() => {
      expect(mocks.handleLogout).toHaveBeenCalled();
      expect(mocks.showToast).toHaveBeenCalledWith('Signout success', 'success');
    });
  });

  it('shows error toast and logs error when logout fails', async () => {
    mocks.handleLogout.mockRejectedValue(new Error('fail'));

    render(<SignoutButton />);
    fireEvent.click(screen.getByTestId('button-with-modal'));

    await waitFor(() => {
      expect(mocks.showToast).toHaveBeenCalledWith('Signout error', 'error');
      expect(mocks.errorHandler).toHaveBeenCalledWith('Signout Error', expect.any(Error));
    });
  });
});
