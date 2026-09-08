import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  onClick: vi.fn(),
}));

vi.mock('@/components/UI/icons/InfoIcon', () => ({
  default: () => <span data-testid="info-icon" />,
}));

vi.mock('@/locales/cs', () => ({
  ARIA_TEXTS: {
    note: 'poznámka',
  },
}));

import InfoButton from '@/features/notes/InfoButton';

describe('InfoButton', () => {
  it('forwards the click handler', () => {
    render(<InfoButton onClick={mocks.onClick} title="Notes" />);

    const button = screen.getByRole('button', { name: 'poznámka' }) as HTMLButtonElement;
    fireEvent.click(button);

    expect(mocks.onClick).toHaveBeenCalledTimes(1);
  });
});
