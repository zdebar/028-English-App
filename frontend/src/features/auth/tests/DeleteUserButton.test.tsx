import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  userId: 'u1' as string | null,
  showToast: vi.fn(),
  clearTheme: vi.fn(),
  clearUserStats: vi.fn(),
  syncUserItemsSinceLastSync: vi.fn(),
  syncUserScoreSinceLastSync: vi.fn(),
  deleteAllUserItems: vi.fn(),
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

vi.mock('@/features/theme/use-theme', () => ({
  useThemeStore: (selector: (state: { clearTheme: typeof mocks.clearTheme }) => unknown) =>
    selector({ clearTheme: mocks.clearTheme }),
}));

vi.mock('@/features/user-stats/use-user-store', () => ({
  useUserStore: (selector: (state: { clearUserStats: typeof mocks.clearUserStats }) => unknown) =>
    selector({ clearUserStats: mocks.clearUserStats }),
}));

vi.mock('@/database/models/user-items', () => ({
  default: {
    syncUserItemsSinceLastSync: (...args: unknown[]) => mocks.syncUserItemsSinceLastSync(...args),
    deleteAllUserItems: (...args: unknown[]) => mocks.deleteAllUserItems(...args),
  },
}));

vi.mock('@/database/models/user-scores', () => ({
  default: {
    syncUserScoreSinceLastSync: (...args: unknown[]) => mocks.syncUserScoreSinceLastSync(...args),
    deleteAllUserScores: (...args: unknown[]) => mocks.deleteAllUserScores(...args),
  },
}));

vi.mock('@/database/models/metadata', () => ({
  default: {
    deleteSyncRow: (...args: unknown[]) => mocks.deleteSyncRow(...args),
  },
}));

vi.mock('@/database/sync-time.utils', () => ({
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
    mocks.syncUserItemsSinceLastSync.mockResolvedValue(undefined);
    mocks.syncUserScoreSinceLastSync.mockResolvedValue(undefined);
    mocks.deleteAllUserItems.mockResolvedValue(0);
    mocks.deleteAllUserScores.mockResolvedValue(0);
    mocks.deleteSyncRow.mockResolvedValue(true);
    mocks.clearTheme.mockResolvedValue(undefined);
    mocks.clearUserStats.mockResolvedValue(undefined);
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
      expect(mocks.invoke).toHaveBeenCalledWith('delete-user', {
        body: { userId: 'u1' },
      });
      expect(mocks.signOut).toHaveBeenCalled();
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
