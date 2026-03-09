import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  userId: 'u1' as string | null,
  showToast: vi.fn(),
  clearTheme: vi.fn(),
  saveCurrentThemeAsGuest: vi.fn(),
  deleteAllItems: vi.fn(),
  deleteAllUserScores: vi.fn(),
  deleteSyncRow: vi.fn(),
  clearSyncTimes: vi.fn(),
  invoke: vi.fn(),
  signOut: vi.fn(),
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

vi.mock('@/features/theme/use-theme-store', () => ({
  useThemeStore: (
    selector: (state: {
      clearTheme: typeof mocks.clearTheme;
      saveCurrentThemeAsGuest: typeof mocks.saveCurrentThemeAsGuest;
    }) => unknown,
  ) =>
    selector({
      clearTheme: mocks.clearTheme,
      saveCurrentThemeAsGuest: mocks.saveCurrentThemeAsGuest,
    }),
}));

vi.mock('@/database/models/user-items', () => ({
  default: {
    deleteAllItems: (...args: unknown[]) => mocks.deleteAllItems(...args),
  },
}));

vi.mock('@/database/models/user-scores', () => ({
  default: {
    deleteAllScores: (...args: unknown[]) => mocks.deleteAllUserScores(...args),
  },
}));

vi.mock('@/database/models/metadata', () => ({
  default: {
    deleteSyncRow: (...args: unknown[]) => mocks.deleteSyncRow(...args),
  },
}));

vi.mock('@/database/utils/sync-time.utils', () => ({
  clearSyncTimes: (...args: unknown[]) => mocks.clearSyncTimes(...args),
}));

vi.mock('@/config/supabase.config', () => ({
  supabaseInstance: {
    functions: {
      invoke: (...args: unknown[]) => mocks.invoke(...args),
    },
    auth: {
      signOut: (...args: unknown[]) => mocks.signOut(...args),
    },
  },
}));

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    deleteUserButtonTitle: 'Delete user',
    deleteUserModalText: 'Confirm delete',
    deleteUserSuccessToast: 'Delete success',
    deleteUserErrorToast: 'Delete error',
  },
}));

vi.mock('@/types/local.types', () => ({
  TableName: {
    UserItems: 'user_items',
    UserScores: 'user_scores',
  },
}));

vi.mock('@/features/logging/error-handler', () => ({
  errorHandler: (...args: unknown[]) => mocks.errorHandler(...args),
}));

vi.mock('@/features/modal/ModalButton', () => ({
  default: ({ disabled, onConfirm, children }: any) => (
    <button data-testid="button-with-modal" disabled={disabled} onClick={() => void onConfirm?.()}>
      {children}
    </button>
  ),
}));

import DeleteUserButton from '@/features/auth/DeleteUserButton';

describe('DeleteUserButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.userId = 'u1';

    mocks.invoke.mockResolvedValue({ error: null });
    mocks.deleteAllItems.mockResolvedValue(0);
    mocks.deleteAllUserScores.mockResolvedValue(0);
    mocks.deleteSyncRow.mockResolvedValue(true);
    mocks.clearTheme.mockResolvedValue(undefined);
    mocks.saveCurrentThemeAsGuest.mockReturnValue(undefined);
    mocks.clearSyncTimes.mockReturnValue(undefined);
    mocks.signOut.mockResolvedValue({ error: null });
  });

  it('is disabled when user is not available', () => {
    mocks.userId = null;

    render(<DeleteUserButton />);

    expect(screen.getByTestId('button-with-modal').hasAttribute('disabled')).toBe(true);
  });

  it('runs delete flow and shows success toast', async () => {
    render(<DeleteUserButton />);

    fireEvent.click(screen.getByTestId('button-with-modal'));

    await waitFor(() => {
      expect(mocks.saveCurrentThemeAsGuest).toHaveBeenCalled();
      expect(mocks.invoke).toHaveBeenCalledWith('delete-user', {
        body: { userId: 'u1' },
      });
      expect(mocks.showToast).toHaveBeenCalledWith('Delete success', 'success');
    });
  });

  it('shows error toast and logs error when delete function fails', async () => {
    mocks.invoke.mockResolvedValue({ error: { message: 'failed' } });

    render(<DeleteUserButton />);
    fireEvent.click(screen.getByTestId('button-with-modal'));

    await waitFor(() => {
      expect(mocks.showToast).toHaveBeenCalledWith('Delete error', 'error');
      expect(mocks.errorHandler).toHaveBeenCalledWith('Delete User Error', expect.any(Error));
    });
  });
});
