import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    restartProgress: 'Restart progress',
    restartDescription: 'Restart description',
    restartProgressHelp: 'Restart help',
    notAvailable: 'Not available',
  },
}));

vi.mock('@/features/modal/ButtonWithModal', () => ({
  default: ({ children, disabled, onConfirm, title }: any) => (
    <button
      data-testid="reset-button"
      disabled={disabled}
      title={title}
      onClick={() => onConfirm?.()}
    >
      {children}
    </button>
  ),
}));

vi.mock('@/components/UI/Card', () => ({
  default: ({ children, className }: any) => <div className={className}>{children}</div>,
}));

vi.mock('@/components/UI/DelayedNotification', () => ({
  default: ({ children }: any) => <span data-testid="delayed-notification">{children}</span>,
}));

vi.mock('@/features/help/HelpText', () => ({
  default: ({ children, className }: any) => <div className={className}>{children}</div>,
}));

vi.mock('@/components/UI/buttons/CloseButton', () => ({
  default: ({ onClick }: any) => (
    <button data-testid="close-button" onClick={onClick}>
      close
    </button>
  ),
}));

import OverviewCard from '@/components/UI/OverviewCard';

describe('OverviewCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the header button, help text, and content', () => {
    render(
      <OverviewCard buttonTitle="Blocks" onClose={vi.fn()}>
        Content
      </OverviewCard>,
    );

    expect(screen.getByTestId('reset-button')).toBeTruthy();
    expect(screen.getByTestId('reset-button').getAttribute('title')).toBe('');
    expect(screen.getByText('Blocks')).toBeTruthy();
    expect(screen.getByText('Restart help')).toBeTruthy();
    expect(screen.getByTestId('close-button')).toBeTruthy();
    expect(screen.getByText('Content')).toBeTruthy();
  });

  it('uses the not available fallback when no button title is provided', () => {
    render(<OverviewCard onClose={vi.fn()}>Content</OverviewCard>);

    expect(screen.getByTestId('delayed-notification').textContent).toBe('Not available');
  });

  it('disables reset when loading or reset handler is missing', () => {
    const { rerender } = render(<OverviewCard loading buttonTitle="Blocks" onClose={vi.fn()} />);

    expect((screen.getByTestId('reset-button') as HTMLButtonElement).disabled).toBe(true);

    rerender(<OverviewCard buttonTitle="Blocks" handleReset={vi.fn()} onClose={vi.fn()} />);

    expect((screen.getByTestId('reset-button') as HTMLButtonElement).disabled).toBe(false);
  });

  it('runs reset and close handlers when confirmed', async () => {
    const handleReset = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <OverviewCard buttonTitle="Blocks" handleReset={handleReset} onClose={onClose}>
        Content
      </OverviewCard>,
    );

    fireEvent.click(screen.getByTestId('reset-button'));

    await waitFor(() => {
      expect(handleReset).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
