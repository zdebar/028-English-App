import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  userId: 'u1' as string | null,
  showToast: vi.fn(),
  resetAllUserItems: vi.fn(),
  errorHandler: vi.fn(),
}));

vi.mock('@/features/auth/use-auth-store', () => ({
  useAuthStore: (selector: (state: { userId: string | null }) => unknown) =>
    selector({ userId: mocks.userId }),
}));

vi.mock('@/features/toast/use-toast-store', () => ({
  useToastStore: (selector: (state: { showToast: typeof mocks.showToast }) => unknown) =>
    selector({ showToast: mocks.showToast }),
}));

vi.mock('@/database/models/user-items', () => ({
  default: {
    resetAllUserItems: (...args: unknown[]) => mocks.resetAllUserItems(...args),
  },
}));

vi.mock('@/features/logging/error-handler', () => ({
  errorHandler: (...args: unknown[]) => mocks.errorHandler(...args),
}));

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    resetAllProgressButtonTitle: 'Reset all',
    resetAllProgressModalText: 'Confirm reset',
    resetProgressSuccessToast: 'Reset success',
    resetProgressErrorToast: 'Reset error',
  },
}));

vi.mock('@/features/modal/ModalButton', () => ({
  default: ({ disabled, onConfirm, children }: any) => (
    <button data-testid="button-with-modal" disabled={disabled} onClick={() => void onConfirm?.()}>
      {children}
    </button>
  ),
}));

import ResetAllProgressButton from '@/features/auth/ResetAllProgressButton';

describe('ResetAllProgressButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.userId = 'u1';
    mocks.resetAllUserItems.mockResolvedValue(1);
  });

  it('is disabled when user is not available', () => {
    mocks.userId = null;

    render(<ResetAllProgressButton />);

    expect(screen.getByTestId('button-with-modal').hasAttribute('disabled')).toBe(true);
  });

  it('resets user progress and shows success toast', async () => {
    render(<ResetAllProgressButton />);
    fireEvent.click(screen.getByTestId('button-with-modal'));

    await waitFor(() => {
      expect(mocks.resetAllUserItems).toHaveBeenCalledWith('u1');
      expect(mocks.showToast).toHaveBeenCalledWith('Reset success', 'success');
    });
  });

  it('shows error toast and logs error when reset fails', async () => {
    mocks.resetAllUserItems.mockRejectedValue(new Error('fail'));

    render(<ResetAllProgressButton />);
    fireEvent.click(screen.getByTestId('button-with-modal'));

    await waitFor(() => {
      expect(mocks.showToast).toHaveBeenCalledWith('Reset error', 'error');
      expect(mocks.errorHandler).toHaveBeenCalledWith('Reset Progress Error', expect.any(Error));
    });
  });
});
