import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/config/config', () => ({
  default: {
    practice: {
      reviewMinimumSize: 20,
    },
  },
}));

vi.mock('@/features/help/HelpText', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="help-text">{children}</div>
  ),
}));

import PracticeOverviewButton from '@/features/practice-overview/PracticeOverviewButton';

describe('PracticeOverviewButton', () => {
  it('renders numeric progress and help text', () => {
    render(
      <PracticeOverviewButton
        count={3}
        goal={200}
        ariaLabel="Open practice overview"
        helpText="Progress today / goal"
      />,
    );

    const button = screen.getByRole('button', { name: 'Open practice overview' });
    expect(button).toBeTruthy();
    expect(button.getAttribute('title')).toBe('Open practice overview');
    expect(button.className).not.toContain('hover:ring');
    expect(button.textContent).toBe('+ 3 / 200Progress today / goal');
    expect(button.className).toContain('hover:underline');
    expect(button.className).toContain('decoration-error-light');
    expect(screen.getByTestId('help-text').textContent).toBe('Progress today / goal');
  });

  it('calls onClick when button is pressed', () => {
    const onClick = vi.fn();

    render(
      <PracticeOverviewButton
        count={1}
        goal={200}
        ariaLabel="Open practice overview"
        helpText="Progress today / goal"
        onClick={onClick}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open practice overview' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('uses error styling until the goal is met and preserves signed values', () => {
    const { rerender } = render(
      <PracticeOverviewButton count={199} goal={200} ariaLabel="Progress" />,
    );

    expect(screen.getByText('+ 199 / 200').className).toContain('text-error-light');

    rerender(<PracticeOverviewButton count={200} goal={200} ariaLabel="Progress" />);
    expect(screen.getByText('+ 200 / 200').className).toContain('text-success-light');
    expect(screen.getByRole('button', { name: 'Progress' }).className).toContain(
      'decoration-success-light',
    );

    rerender(<PracticeOverviewButton count={235} goal={200} ariaLabel="Progress" />);
    expect(screen.getByText('+ 235 / 200')).toBeTruthy();

    rerender(<PracticeOverviewButton count={-5} goal={200} ariaLabel="Progress" />);
    expect(screen.getByText('- 5 / 200')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Progress' }).className).toContain(
      'decoration-error-light',
    );

    rerender(<PracticeOverviewButton count={0} goal={200} ariaLabel="Progress" />);
    expect(screen.getByText('0 / 200')).toBeTruthy();
  });
});
