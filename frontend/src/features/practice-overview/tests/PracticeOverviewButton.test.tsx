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
        ariaLabel="Open practice overview"
        helpText="Stars today"
      />,
    );

    const button = screen.getByRole('button', { name: 'Open practice overview' });
    expect(button).toBeTruthy();
    expect(button.getAttribute('title')).toBe('Open practice overview');
    expect(button.className).not.toContain('hover:ring');
    expect(button.textContent).toBe('+3Stars today');
    expect(screen.getByTestId('help-text').textContent).toBe('Stars today');
  });

  it('calls onClick when button is pressed', () => {
    const onClick = vi.fn();

    render(
      <PracticeOverviewButton
        count={1}
        ariaLabel="Open practice overview"
        helpText="Stars today"
        onClick={onClick}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open practice overview' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
