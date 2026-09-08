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

});
