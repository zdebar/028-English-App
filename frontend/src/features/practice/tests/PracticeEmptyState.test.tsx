import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/components/UI/Notification', () => ({
  default: ({ children, className }: any) => <div className={className}>{children}</div>,
}));

vi.mock('@/components/UI/buttons/ReturnHomeButton', () => ({
  default: () => <button>Home</button>,
}));

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    nothingToPractice: 'Nothing to practice',
    tryAgainLater: 'Try again later',
  },
}));

import PracticeEmptyState from '../PracticeEmptyState';

describe('PracticeEmptyState', () => {
  it('uses the standard card top position without desktop vertical centering', () => {
    const { container } = render(<PracticeEmptyState />);
    const card = container.firstElementChild;

    expect(card?.className).toBe('card-width w-full pt-24');
    expect(screen.getByText('Nothing to practice')).toBeTruthy();
    expect(screen.getByText('Try again later')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Home' })).toBeTruthy();
  });

  it('can hide the retry-later message for terminal empty states', () => {
    render(<PracticeEmptyState showTryAgainLater={false} />);

    expect(screen.getByText('Nothing to practice')).toBeTruthy();
    expect(screen.queryByText('Try again later')).toBeNull();
  });
});
