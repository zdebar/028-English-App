import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createAsyncButtonMock,
  createAuthStoreMock,
  createDelegatedMock,
  createToastStoreMock,
} from './sync-test-helpers';

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
  useAuthStore: createAuthStoreMock(() => mocks.userId),
}));

vi.mock('@/features/toast/use-toast-store', () => ({
  useToastStore: createToastStoreMock(
    () => mocks.showToast,
    () => mocks.hideToast,
  ),
}));

vi.mock('@/database/utils/data-sync.utils', () => ({
  dataSync: createDelegatedMock(mocks.dataSync),
  audioSync: createDelegatedMock(mocks.audioSync),
}));

vi.mock('@/features/logging/logging.utils', () => ({
  logRejectedResults: createDelegatedMock(mocks.logRejectedResults),
}));

vi.mock('@/features/logging/error-handler', () => ({
  errorHandler: createDelegatedMock(mocks.errorHandler),
}));

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    dataSyncSuccess: 'Sync done',
    dataSyncError: 'Sync failed',
    dataSyncTooltip: 'Sync tooltip',
    syncButton: 'Sync now',
    syncButtonDescription: 'Sync description',
  },
}));

vi.mock('@/features/modal/ButtonWithModal', () => ({
  default: createAsyncButtonMock('sync-modal-button', 'onConfirm'),
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

    expect((screen.getByTestId('sync-modal-button') as HTMLButtonElement).disabled).toBe(true);
  });

  it('runs sync flow and shows success toast', async () => {
    render(<SyncButton className="custom" />);

    fireEvent.click(screen.getByTestId('sync-modal-button'));

    await waitFor(() => {
      expect(mocks.dataSync).toHaveBeenCalledWith('u1', true);
      expect(mocks.audioSync).toHaveBeenCalledWith('u1');
      expect(mocks.showToast).toHaveBeenCalledWith('Sync done', 'success');
    });
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
      expect(mocks.showToast).toHaveBeenCalledWith('Sync failed', 'error');
      expect(mocks.errorHandler).toHaveBeenCalledWith(
        'Error synchronizing data',
        expect.any(Error),
      );
    });
  });
});
