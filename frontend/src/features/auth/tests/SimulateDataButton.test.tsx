import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  userId: 'u1',
  simulateData: vi.fn(),
  showToast: vi.fn(),
  reportError: vi.fn(),
}));

vi.mock('@/features/auth/use-auth-store', () => ({
  useAuthStore: (selector: (state: { userId: string | null }) => unknown) =>
    selector({ userId: mocks.userId }),
}));

vi.mock('@/database/models/user-items', () => ({
  default: {
    simulateData: (...args: unknown[]) => mocks.simulateData(...args),
  },
}));

vi.mock('@/features/toast/use-toast-store', () => ({
  useToastStore: (selector: (state: { showToast: typeof mocks.showToast }) => unknown) =>
    selector({ showToast: mocks.showToast }),
}));

vi.mock('@/features/logging/monitoring-handler', () => ({
  reportError: (...args: unknown[]) => mocks.reportError(...args),
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

import SimulateDataButton from '@/features/auth/SimulateDataButton';

describe('SimulateDataButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.userId = 'u1';
    mocks.simulateData.mockResolvedValue(200);
  });

  it('calls simulateData and shows success toast', async () => {
    render(<SimulateDataButton />);

    fireEvent.click(screen.getByRole('button', { name: 'Simulovat data' }));

    await waitFor(() => {
      expect(mocks.simulateData).toHaveBeenCalledWith('u1');
      expect(mocks.showToast).toHaveBeenCalledWith('Data byla úspěšně simulována.', 'success');
    });
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
  });

  it('does nothing when user is missing', async () => {
    mocks.userId = null;

    render(<SimulateDataButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Simulovat data' }));

    await waitFor(() => {
      expect(mocks.simulateData).not.toHaveBeenCalled();
      expect(mocks.showToast).not.toHaveBeenCalled();
    });
  });
});
