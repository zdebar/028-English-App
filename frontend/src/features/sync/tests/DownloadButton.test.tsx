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
  isLoading: false,
  setIsLoading: vi.fn(),
  showToast: vi.fn(),
  hideToast: vi.fn(),
  audioSync: vi.fn(),
  logRejectedResults: vi.fn(),
  clearAudioMeta: vi.fn(),
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

vi.mock('@/features/modal/use-min-loading', () => ({
  useMinLoading: () => ({
    isLoading: mocks.isLoading,
    setIsLoading: mocks.setIsLoading,
  }),
}));

vi.mock('@/database/models/db', () => ({
  db: {
    audio_metadata: {
      clear: createDelegatedMock(mocks.clearAudioMeta),
    },
  },
}));

vi.mock('@/database/utils/data-sync.utils', () => ({
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
    syncLoadingText: 'Syncing...',
    downloadSuccessToast: 'Download done',
    downloadErrorToast: 'Download failed',
    downloadButtonTooltip: 'Download tooltip',
    downloadButton: 'Download',
  },
}));

vi.mock('@/components/UI/buttons/MenuButton', () => ({
  MenuButton: createAsyncButtonMock('download-button', 'onClick'),
}));

import DownloadButton from '@/features/sync/DownloadButtton';

describe('DownloadButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.userId = 'u1';
    mocks.isLoading = false;
    mocks.audioSync.mockResolvedValue(undefined);
    mocks.logRejectedResults.mockReturnValue(false);
  });

  it('is disabled when user is not available', () => {
    mocks.userId = null;

    render(<DownloadButton />);

    expect(screen.getByTestId('download-button').hasAttribute('disabled')).toBe(true);
  });

  it('is disabled while loading', () => {
    mocks.isLoading = true;

    render(<DownloadButton />);

    expect(screen.getByTestId('download-button').hasAttribute('disabled')).toBe(true);
  });

  it('runs download flow and shows success toast', async () => {
    render(<DownloadButton className="x" />);

    fireEvent.click(screen.getByTestId('download-button'));

    await waitFor(() => {
      expect(mocks.setIsLoading).toHaveBeenCalledWith(true);
      expect(mocks.clearAudioMeta).toHaveBeenCalled();
      expect(mocks.audioSync).toHaveBeenCalledWith('u1', true);
      expect(mocks.hideToast).toHaveBeenCalled();
      expect(mocks.showToast).toHaveBeenCalledWith('Download done', 'success');
      expect(mocks.setIsLoading).toHaveBeenCalledWith(false);
    });

    expect(mocks.showToast).toHaveBeenCalledWith('Syncing...', 'info', true);
    expect(mocks.logRejectedResults).toHaveBeenCalledWith(
      expect.any(Array),
      'Data download error:',
    );
  });

  it('shows error toast and logs when download fails', async () => {
    mocks.logRejectedResults.mockReturnValue(true);

    render(<DownloadButton />);

    fireEvent.click(screen.getByTestId('download-button'));

    await waitFor(() => {
      expect(mocks.hideToast).toHaveBeenCalled();
      expect(mocks.showToast).toHaveBeenCalledWith('Download failed', 'error');
      expect(mocks.errorHandler).toHaveBeenCalledWith('Download Error', expect.any(Error));
      expect(mocks.setIsLoading).toHaveBeenCalledWith(false);
    });
  });
});
