import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(
  (): {
    userId: string | null;
    authLoading: boolean;
    isSynchronized: boolean;
    isSynchronizing: boolean;
    simulateData: ReturnType<typeof vi.fn>;
    showToast: ReturnType<typeof vi.fn>;
    reportError: ReturnType<typeof vi.fn>;
  } => ({
    userId: 'u1',
    authLoading: false,
    isSynchronized: true,
    isSynchronizing: false,
    simulateData: vi.fn(),
    showToast: vi.fn(),
    reportError: vi.fn(),
  }),
);

function getSimulateButton(): HTMLButtonElement {
  return screen.getByRole('button', { name: 'Simulovat data' }) as HTMLButtonElement;
}

vi.mock('@/features/auth/use-auth-store', () => ({
  useAuthStore: (selector: (state: { userId: string | null; loading: boolean }) => unknown) =>
    selector({
      userId: mocks.userId,
      loading: mocks.authLoading,
    }),
}));

vi.mock('@/features/synchronization/use-sync-store', () => ({
  useSyncStore: (
    selector: (state: { isSynchronized: boolean; isSynchronizing: boolean }) => unknown,
  ) =>
    selector({
      isSynchronized: mocks.isSynchronized,
      isSynchronizing: mocks.isSynchronizing,
    }),
}));

vi.mock('@/database/models/user-items', () => ({
  default: {
    simulateData: (...args: unknown[]) =>
      (mocks.simulateData as (...args: unknown[]) => unknown)(...args),
  },
}));

vi.mock('@/features/toast/use-toast-store', () => ({
  useToastStore: (selector: (state: { showToast: typeof mocks.showToast }) => unknown) =>
    selector({ showToast: mocks.showToast }),
}));

vi.mock('@/features/logging/monitoring-handler', () => ({
  reportError: (...args: unknown[]) =>
    (mocks.reportError as (...args: unknown[]) => unknown)(...args),
}));

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    simulateDataButton: 'Simulovat data',
    simulateDataLoading: 'Simuluji data ...',
    simulateDataTooltip: 'Simulate tooltip',
    simulateDataSuccessToast: 'Data byla úspěšně simulována.',
    simulateDataErrorToast: 'Chyba při simulaci dat.',
  },
}));

import SimulateDataButton from '@/features/synchronization/SimulateDataButton';

describe('SimulateDataButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mocks.userId = 'u1';
    mocks.authLoading = false;
    mocks.isSynchronized = true;
    mocks.isSynchronizing = false;
    mocks.simulateData.mockResolvedValue(200);
  });

  it('calls simulateData and stores simulated state on success', async () => {
    render(<SimulateDataButton />);

    fireEvent.click(screen.getByRole('button', { name: 'Simulovat data' }));

    await waitFor(() => {
      expect(mocks.simulateData).toHaveBeenCalledWith('u1');
      expect(mocks.showToast).toHaveBeenCalledWith('Data byla úspěšně simulována.', 'success');
    });

    expect(localStorage.getItem('simulate-data-u1')).toBe(JSON.stringify(true));
  });

  it('shows error toast and logs error when simulateData fails', async () => {
    const error = new Error('simulate failed');
    mocks.simulateData.mockRejectedValue(error);

    render(<SimulateDataButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Simulovat data' }));

    await waitFor(() => {
      expect(mocks.showToast).toHaveBeenCalledWith('Chyba při simulaci dat.', 'error');
      expect(mocks.reportError).toHaveBeenCalledWith('Simulate data failed', error);
    });

    expect(localStorage.getItem('simulate-data-u1')).toBe(JSON.stringify(false));
  });

  it('does nothing when user is missing', async () => {
    mocks.userId = null;

    render(<SimulateDataButton />);
    expect(screen.queryByRole('button', { name: 'Simulovat data' })).toBeNull();

    expect(mocks.simulateData).not.toHaveBeenCalled();
    expect(mocks.showToast).not.toHaveBeenCalled();
  });

  it('is disabled until sync completes', () => {
    mocks.isSynchronized = false;

    render(<SimulateDataButton />);

    expect(getSimulateButton().disabled).toBe(true);
  });

  it('is disabled while auth is loading', () => {
    mocks.authLoading = true;

    render(<SimulateDataButton />);

    expect(getSimulateButton().disabled).toBe(true);
  });

  it('is disabled while synchronization is in progress', () => {
    mocks.isSynchronizing = true;

    render(<SimulateDataButton />);

    expect(getSimulateButton().disabled).toBe(true);
  });

  it('is disabled after the current user has already simulated data', () => {
    localStorage.setItem('simulate-data-u1', JSON.stringify(true));

    render(<SimulateDataButton />);

    expect(getSimulateButton().disabled).toBe(true);
  });
});
