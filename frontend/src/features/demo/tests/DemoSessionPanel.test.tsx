import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  loginDemo: vi.fn(),
  getDemoSigninErrorMessage: vi.fn(),
  showToast: vi.fn(),
  reportError: vi.fn(),
}));

vi.mock('@/features/demo/demo-auth-service', () => ({
  loginDemo: (...args: unknown[]) => mocks.loginDemo(...args),
}));

vi.mock('@/features/demo/demo-signin-error', () => ({
  getDemoSigninErrorMessage: (...args: unknown[]) => mocks.getDemoSigninErrorMessage(...args),
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
    demoSigninSuccess: 'Demo success',
    demoSigninButton: 'Try demo',
    demoSigninLoading: 'Signing in demo ...',
    demoSigninButtonTooltip: 'Tooltip',
  },
}));

import DemoSessionPanel from '@/features/demo/DemoSessionPanel';

describe('DemoSessionPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.loginDemo.mockResolvedValue(undefined);
    mocks.getDemoSigninErrorMessage.mockReturnValue('Mapped demo error');
  });

  it('renders button text and tooltip', () => {
    render(<DemoSessionPanel />);

    const button = screen.getByRole('button', { name: 'Try demo' });
    expect(button.getAttribute('title')).toBe('Tooltip');
  });

  it('runs demo flow and shows success toast', async () => {
    render(<DemoSessionPanel />);

    fireEvent.click(screen.getByRole('button', { name: 'Try demo' }));

    await waitFor(() => {
      expect(mocks.loginDemo).toHaveBeenCalledTimes(1);
      expect(mocks.showToast).toHaveBeenCalledWith('Demo success', 'success');
    });
  });

  it('disables button while submitting and prevents duplicate clicks', async () => {
    let resolvePromise: (() => void) | null = null;
    mocks.loginDemo.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolvePromise = resolve;
        }),
    );

    render(<DemoSessionPanel />);

    const button = screen.getByRole('button', { name: 'Try demo' });
    fireEvent.click(button);
    fireEvent.click(button);

    expect(mocks.loginDemo).toHaveBeenCalledTimes(1);
    expect((screen.getByRole('button') as HTMLButtonElement).disabled).toBe(true);

    resolvePromise?.();
    await waitFor(() => {
      expect((screen.getByRole('button') as HTMLButtonElement).disabled).toBe(false);
    });
  });

  it('reports error and shows mapped error toast on failure', async () => {
    const failure = new Error('boom');
    mocks.loginDemo.mockRejectedValue(failure);

    render(<DemoSessionPanel />);
    fireEvent.click(screen.getByRole('button', { name: 'Try demo' }));

    await waitFor(() => {
      expect(mocks.reportError).toHaveBeenCalledWith('Demo sign-in failed', failure);
      expect(mocks.getDemoSigninErrorMessage).toHaveBeenCalledWith(failure);
      expect(mocks.showToast).toHaveBeenCalledWith('Mapped demo error', 'error');
    });
  });
});
