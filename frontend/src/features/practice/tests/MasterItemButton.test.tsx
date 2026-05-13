import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import config from '@/config/config';

const mocks = vi.hoisted(() => ({
  showToast: vi.fn(),
}));

const HOLD_DURATION_MS = config.practice.holdDuration;

vi.mock('@/features/toast/use-toast-store', () => ({
  useToastStore: (selector: (state: { showToast: typeof mocks.showToast }) => unknown) =>
    selector({ showToast: mocks.showToast }),
}));

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    skipSuccessToast: 'Skip success',
    skipErrorToast: 'Skip error',
    skipHoldInfoToast: 'Hold to skip',
    complete: 'Complete',
  },
}));

vi.mock('@/components/UI/buttons/StyledButton', () => ({
  default: ({ children, ...props }: any) => (
    <button data-testid="master-button" {...props}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/UI/icons/ForwardIcon', () => ({
  default: () => <span data-testid="forward-icon" />,
}));

vi.mock('@/features/help/HelpText', () => ({
  default: ({ children }: any) => <span>{children}</span>,
}));

import MasterItemButton from '@/features/practice/buttons/MasterItemButton';

describe('MasterItemButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders button content and helper text', () => {
    render(
      <MasterItemButton disabled={false} onConfirm={vi.fn()}>
        Child
      </MasterItemButton>,
    );

    expect(screen.getByTestId('master-button')).toBeTruthy();
    expect(screen.getByTestId('forward-icon')).toBeTruthy();
    expect(screen.getByText('Complete')).toBeTruthy();
    expect(screen.getByText('Child')).toBeTruthy();
  });

  it('shows info toast on short click when enabled', () => {
    render(<MasterItemButton disabled={false} onConfirm={vi.fn()} />);

    fireEvent.mouseDown(screen.getByTestId('master-button'));
    vi.advanceTimersByTime(Math.max(HOLD_DURATION_MS - 1, 0));
    fireEvent.mouseUp(screen.getByTestId('master-button'));
    fireEvent.click(screen.getByTestId('master-button'));

    expect(mocks.showToast).toHaveBeenCalledWith('Hold to skip', 'info');
  });

  it('triggers onConfirm after long press and shows success toast', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(<MasterItemButton disabled={false} onConfirm={onConfirm} />);

    fireEvent.mouseDown(screen.getByTestId('master-button'));
    await vi.advanceTimersByTimeAsync(HOLD_DURATION_MS);

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(mocks.showToast).toHaveBeenCalledWith('Skip success', 'success');
  });

  it('shows error toast when long-press onConfirm fails', async () => {
    const onConfirm = vi.fn().mockRejectedValue(new Error('fail'));
    render(<MasterItemButton disabled={false} onConfirm={onConfirm} />);

    fireEvent.touchStart(screen.getByTestId('master-button'));
    await vi.advanceTimersByTimeAsync(HOLD_DURATION_MS);

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(mocks.showToast).toHaveBeenCalledWith('Skip error', 'error');
  });

  it('does nothing when disabled', () => {
    const onConfirm = vi.fn();
    render(<MasterItemButton disabled onConfirm={onConfirm} />);

    fireEvent.mouseDown(screen.getByTestId('master-button'));
    vi.advanceTimersByTime(700);
    fireEvent.click(screen.getByTestId('master-button'));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(mocks.showToast).not.toHaveBeenCalled();
  });

  it('does not show info toast after long press has already triggered', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(<MasterItemButton disabled={false} onConfirm={onConfirm} />);

    fireEvent.mouseDown(screen.getByTestId('master-button'));
    await vi.advanceTimersByTimeAsync(HOLD_DURATION_MS);
    expect(onConfirm).toHaveBeenCalledTimes(1);

    fireEvent.mouseUp(screen.getByTestId('master-button'));
    fireEvent.click(screen.getByTestId('master-button'));

    expect(mocks.showToast).not.toHaveBeenCalledWith('Hold to skip', 'info');
  });
});
