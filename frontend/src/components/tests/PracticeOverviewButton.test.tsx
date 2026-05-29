import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/config/config', () => ({
  default: {
    practice: {
      starChunk: 50,
      starsPerRow: 10,
    },
  },
}));

vi.mock('@/components/UI/StarProgress', () => ({
  default: ({
    count,
    chunkSize,
    starsPerRow,
  }: {
    count: number;
    chunkSize: number;
    starsPerRow: number;
  }) => (
    <div data-testid="star-progress">
      {count}:{chunkSize}:{starsPerRow}
    </div>
  ),
}));

vi.mock('@/features/help/HelpText', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="help-text">{children}</div>
  ),
}));

import PracticeOverviewButton from '@/components/PracticeOverviewButton';

describe('PracticeOverviewButton', () => {
  it('renders star progress and help text', () => {
    render(
      <PracticeOverviewButton
        count={3}
        ariaLabel="Open practice overview"
        helpText="Stars today"
      />,
    );

    expect(screen.getByRole('button', { name: 'Open practice overview' })).toBeTruthy();
    expect(screen.getByTestId('star-progress').textContent).toBe('3:50:10');
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
