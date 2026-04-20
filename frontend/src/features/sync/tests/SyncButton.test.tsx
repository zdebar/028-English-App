import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  userId: 'u1' as string | null,
  showToast: vi.fn(),
  hideToast: vi.fn(),
  dataSync: vi.fn(),
  audioSync: vi.fn(),
  logRejectedResults: vi.fn(),
  errorHandler: vi.fn(),
}));

vi.mock('@/features/auth/use-auth-store', () => ({
  useAuthStore: (selector: (state: { userId: string | null }) => unknown) =>
    selector({ userId: mocks.userId }),
}));

vi.mock('@/features/toast/use-toast-store', () => ({
  useToastStore: (
    selector: (state: {
      showToast: typeof mocks.showToast;
      hideToast: typeof mocks.hideToast;
    }) => unknown,
  ) =>
    selector({
      showToast: mocks.showToast,
      hideToast: mocks.hideToast,
    }),
}));

vi.mock('@/database/utils/data-sync.utils', () => ({
  dataSync: (...args: unknown[]) => mocks.dataSync(...args),
  audioSync: (...args: unknown[]) => mocks.audioSync(...args),
}));

vi.mock('@/features/logging/logging.utils', () => ({
  logRejectedResults: (...args: unknown[]) => mocks.logRejectedResults(...args),
}));

vi.mock('@/features/logging/error-handler', () => ({
  errorHandler: (...args: unknown[]) => mocks.errorHandler(...args),
}));

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    syncLoadingText: 'Syncing...',
    syncSuccessToast: 'Sync done',
    syncErrorToast: 'Sync failed',
    dataSyncTooltip: 'Sync tooltip',
    syncButton: 'Sync now',
    syncButtonDescription: 'Sync description',
  },
}));

vi.mock('@/features/modal/ModalButton', () => ({
  default: ({
    disabled,
    onConfirm,
    children,
  }: {
    disabled?: boolean;
    onConfirm?: () => Promise<void>;
    children?: React.ReactNode;
  }) => (
    <button data-testid="sync-modal-button" disabled={disabled} onClick={() => void onConfirm?.()}>
      {children}
    </button>
  ),
}));

import SyncButton from '@/features/sync/SyncButton';

describe('SyncButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.userId = 'u1';
    mocks.dataSync.mockResolvedValue(undefined);
    mocks.audioSync.mockResolvedValue(undefined);
    mocks.logRejectedResults.mockReturnValue(false);
  });

  it('is disabled when user is not available', () => {
    mocks.userId = null;

    render(<SyncButton />);

    expect(screen.getByTestId('sync-modal-button').hasAttribute('disabled')).toBe(true);
  });

  it('runs sync flow and shows success toast', async () => {
    render(<SyncButton className="custom" />);

    fireEvent.click(screen.getByTestId('sync-modal-button'));

    await waitFor(() => {
      expect(mocks.dataSync).toHaveBeenCalledWith('u1', true);
      expect(mocks.audioSync).toHaveBeenCalledWith('u1');
      expect(mocks.hideToast).toHaveBeenCalled();
      expect(mocks.showToast).toHaveBeenCalledWith('Sync done', 'success');
    });

    expect(mocks.showToast).toHaveBeenCalledWith('Syncing...', 'info', true);
    expect(mocks.logRejectedResults).toHaveBeenCalledWith(
      expect.any(Array),
      'Data synchronization error:',
    );
  });

  it('shows error toast and logs when sync fails', async () => {
    mocks.logRejectedResults.mockReturnValue(true);

    render(<SyncButton />);

    fireEvent.click(screen.getByTestId('sync-modal-button'));

    await waitFor(() => {
      expect(mocks.hideToast).toHaveBeenCalled();
      expect(mocks.showToast).toHaveBeenCalledWith('Sync failed', 'error');
      expect(mocks.errorHandler).toHaveBeenCalledWith('Sync Error', expect.any(Error));
    });
  });
});
